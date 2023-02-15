import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../enums/role.enum";
import { Permission, PermissionType } from "../../iam/authorization/permission.type";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ enum: Role, default: Role.Regular })
  role: Role;

  /**
   * The subject's (user) permissions.
   * NOTE: Using this approach in combination with the "role-based" approach
   * does not make sense. We have those two properties here ("role" and "permissions")
   * just to showcase two alternative approaches.
   */
  @Column({ enum: Permission, default: [], type: 'json' })
  permissions: PermissionType[];
}
