import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/data';
import { UserRole } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    const isDbConfigured = () => {
      const dbUrl = process.env.DATABASE_URL || '';
      return dbUrl !== '' && !dbUrl.includes('placeholder');
    };

    if (req.method === 'GET') {
      if (!isDbConfigured()) {
        // Mock fallback
        const data = require('@/lib/data');
        const reps = data.mockUsers.filter((u: any) => u.role === 'REP');
        const resolved = reps.map((rep: any) => {
          const onboarded = data.mockBusinesses.filter((b: any) => b.createdByRepId === rep.id).length;
          const assignments = data.mockAssignmentLogs.filter((l: any) => l.assignedBy === rep.id).length;
          const logs = data.mockLogs.filter((l: any) => l.userId === rep.id);
          logs.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
          const lastActivity = logs.length > 0 ? logs[0].createdAt : null;
          return {
            ...rep,
            businessesCount: onboarded,
            assignmentsCount: assignments,
            lastActivity
          };
        });
        return res.status(200).json({ reps: resolved });
      }

      const reps = await db.user.findMany({
        where: { role: UserRole.REP },
        orderBy: { createdAt: 'desc' }
      });

      const repIds = reps.map(r => r.id);

      const [businessCounts, assignmentCounts, lastLogs] = await Promise.all([
        db.business.groupBy({
          by: ['createdByRepId'],
          where: { createdByRepId: { in: repIds } },
          _count: { id: true }
        }),
        db.assignmentLog.groupBy({
          by: ['assignedBy'],
          where: { assignedBy: { in: repIds } },
          _count: { id: true }
        }),
        Promise.all(
          reps.map(rep => db.activityLog.findFirst({
            where: { userId: rep.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
          }))
        )
      ]);

      const bizCountMap = new Map(businessCounts.map(c => [c.createdByRepId, c._count.id]));
      const assignCountMap = new Map(assignmentCounts.map(c => [c.assignedBy, c._count.id]));

      const resolved = reps.map((rep, index) => {
        const lastLog = lastLogs[index];
        return {
          id: rep.id,
          name: rep.name,
          email: rep.email,
          username: rep.username,
          isActive: rep.isActive,
          createdAt: rep.createdAt,
          businessesCount: bizCountMap.get(rep.id) || 0,
          assignmentsCount: assignCountMap.get(rep.id) || 0,
          lastActivity: lastLog ? lastLog.createdAt : null
        };
      });

      return res.status(200).json({ reps: resolved });
    }

    if (req.method === 'POST') {
      const { name, username, password } = req.body;
      if (!name || !username || !password) {
        return res.status(400).json({ error: 'Name, username, and password are required.' });
      }

      const passwordHash = await hashPassword(password);

      if (!isDbConfigured()) {
        const data = require('@/lib/data');
        const existing = data.mockUsers.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
        if (existing) {
          return res.status(400).json({ error: 'Username is already taken.' });
        }
        const newRep = {
          id: `u-${Math.random().toString(36).substring(2, 9)}`,
          name,
          email: null,
          username,
          passwordHash,
          role: 'REP',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        data.mockUsers.push(newRep);
        await logActivity(sessionUser.id, 'Created Representative', 'USER', newRep.id);
        return res.status(201).json({ message: 'Representative created successfully.', rep: newRep });
      }

      const existing = await db.user.findUnique({ where: { username } });
      if (existing) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }

      const rep = await db.user.create({
        data: {
          name,
          username,
          passwordHash,
          role: UserRole.REP,
          isActive: true
        }
      });

      await logActivity(sessionUser.id, 'Created Representative', 'USER', rep.id);

      return res.status(201).json({ message: 'Representative created successfully.', rep });
    }

    if (req.method === 'PUT') {
      const { id, name, username, password, isActive } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Representative ID is required.' });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (username !== undefined) updateData.username = username;
      if (password) updateData.passwordHash = await hashPassword(password);
      if (isActive !== undefined) updateData.isActive = isActive;

      if (!isDbConfigured()) {
        const data = require('@/lib/data');
        const repIndex = data.mockUsers.findIndex((u: any) => u.id === id);
        if (repIndex === -1) {
          return res.status(404).json({ error: 'Representative not found.' });
        }
        data.mockUsers[repIndex] = {
          ...data.mockUsers[repIndex],
          ...updateData,
          updatedAt: new Date()
        };
        const actionStr = isActive === false ? 'Deactivated Representative' : 'Updated Representative';
        await logActivity(sessionUser.id, actionStr, 'USER', id);
        return res.status(200).json({ message: 'Representative updated successfully.' });
      }

      const rep = await db.user.update({
        where: { id },
        data: updateData
      });

      const actionStr = isActive === false ? 'Deactivated Representative' : 'Updated Representative';
      await logActivity(sessionUser.id, actionStr, 'USER', id);

      return res.status(200).json({ message: 'Representative updated successfully.', rep });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Super Admin reps API error:', error);
    return res.status(500).json({ error: 'Internal server error managing representatives.' });
  }
}
