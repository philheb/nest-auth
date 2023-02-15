import { ActiveUserDataInterface } from '../../../interfaces/active-user-data.interface';
import { Policy } from './policy.interface';

export interface PolicyHandler<T extends Policy> {
  handle(policy: T, user: ActiveUserDataInterface): Promise<void>;
}
