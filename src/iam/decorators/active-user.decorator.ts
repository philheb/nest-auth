import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from '../iam.constants';
import { ActiveUserDataInterface } from '../interfaces/active-user-data.interface';

export const ActiveUser = createParamDecorator(
  (
    field: keyof ActiveUserDataInterface | undefined,
    context: ExecutionContext,
  ) => {
    const request = context.switchToHttp().getRequest();
    const user: ActiveUserDataInterface | undefined = request[REQUEST_USER_KEY];
    return field ? user?.[field] : user;
  },
);
