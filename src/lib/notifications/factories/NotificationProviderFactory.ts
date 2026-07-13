import { NotificationProvider } from '../types/enums';
import { NotificationProviderInterface } from '../types/interfaces';
import { MetaProvider } from '../providers/MetaProvider';

export class NotificationProviderFactory {
  private static metaProvider = new MetaProvider();

  static getProvider(provider: NotificationProvider): NotificationProviderInterface {
    switch (provider) {
      case NotificationProvider.META:
        return this.metaProvider;
      default:
        throw new Error(`Unsupported notification provider: "${provider}"`);
    }
  }
}
