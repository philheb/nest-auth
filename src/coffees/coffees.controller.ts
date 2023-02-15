import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { CoffeesService } from './coffees.service';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { ActiveUser } from '../iam/decorators/active-user.decorator';
import { ActiveUserDataInterface } from '../iam/interfaces/active-user-data.interface';
import { Roles } from '../iam/authorization/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { Permissions } from '../iam/authorization/decorators/permissions.decorator';
import { Permission } from '../iam/authorization/permission.type';
import { Policies } from '../iam/authorization/decorators/policies.decorator';
import { FrameworkContributorPolicy } from '../iam/authorization/policies/framework-contributor.policy';

@Controller('coffees')
export class CoffeesController {
  constructor(private readonly coffeesService: CoffeesService) {}

  // @Roles(Role.Admin) //Protecting the route based on the role
  // @Permissions(Permission.CreateCoffee) //Protecting the route based on the permission
  @Policies(
    new FrameworkContributorPolicy() /**, new maxAgePolicy(), new OnlyAdminPolicy(), ... */, //Can add mutiple policies
  )
  @Post()
  create(@Body() createCoffeeDto: CreateCoffeeDto) {
    return this.coffeesService.create(createCoffeeDto);
  }

  @Get()
  findAll(@ActiveUser() user: ActiveUserDataInterface) {
    console.log(user, 'Active User');
    return this.coffeesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coffeesService.findOne(+id);
  }

  @Roles(Role.Admin) //Protecting the route based on the role
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCoffeeDto: UpdateCoffeeDto) {
    return this.coffeesService.update(+id, updateCoffeeDto);
  }

  @Roles(Role.Admin) //Protecting the route based on the role
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coffeesService.remove(+id);
  }
}
