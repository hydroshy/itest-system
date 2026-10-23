export interface MenuItemDto {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  category: 'system' | 'plugin';
  pluginId?: string;
  tab?: string;
  order: number;
}

export interface RoleMenuAssignmentDto {
  roleCode: string;
  menuItemIds: string[];
}

export interface AssignRoleMenuDto {
  roleCode: string;
  menuItemIds: string[];
}
