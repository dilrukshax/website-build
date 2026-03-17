import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

export class RolesController {
    /**
     * List all roles for the current tenant.
     */
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;

            const roles = await db.role.findMany({
                where: { tenantId },
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                    _count: { select: { users: true } },
                },
                orderBy: { createdAt: 'asc' },
            });

            const data = roles.map((role) => ({
                id: role.id,
                name: role.name,
                description: role.description,
                isSystemRole: role.isSystemRole,
                permissions: role.permissions.map((rp) => ({
                    id: rp.permission.id,
                    key: rp.permission.key,
                    name: rp.permission.name,
                    module: rp.permission.module,
                })),
                userCount: role._count.users,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
            }));

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a custom role for the current tenant.
     */
    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const { name, description, permissionIds } = req.body;

            // Check name uniqueness within tenant
            const existing = await db.role.findUnique({
                where: { tenantId_name: { tenantId, name } },
            });
            if (existing) {
                throw new AppError(ERROR_CODES.ALREADY_EXISTS, 'A role with this name already exists', 409, 'name');
            }

            // Verify all permission IDs are valid
            const permissions = await db.permission.findMany({
                where: { id: { in: permissionIds } },
            });
            if (permissions.length !== permissionIds.length) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'One or more permission IDs are invalid', 400, 'permissionIds');
            }

            const role = await db.$transaction(async (tx) => {
                const created = await tx.role.create({
                    data: {
                        tenantId,
                        name,
                        description: description || null,
                        isSystemRole: false,
                    },
                });

                await tx.rolePermission.createMany({
                    data: permissionIds.map((permissionId: string) => ({
                        roleId: created.id,
                        permissionId,
                    })),
                });

                return created;
            });

            // Fetch the full role with permissions for response
            const fullRole = await db.role.findUnique({
                where: { id: role.id },
                include: {
                    permissions: { include: { permission: true } },
                },
            });

            res.status(201).json({
                success: true,
                data: {
                    id: fullRole!.id,
                    name: fullRole!.name,
                    description: fullRole!.description,
                    isSystemRole: fullRole!.isSystemRole,
                    permissions: fullRole!.permissions.map((rp) => ({
                        id: rp.permission.id,
                        key: rp.permission.key,
                        name: rp.permission.name,
                        module: rp.permission.module,
                    })),
                    createdAt: fullRole!.createdAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific role by ID.
     */
    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;

            const role = await db.role.findFirst({
                where: { id, tenantId },
                include: {
                    permissions: { include: { permission: true } },
                    _count: { select: { users: true } },
                },
            });

            if (!role) {
                throw new AppError(ERROR_CODES.ROLE_NOT_FOUND, 'Role not found', 404);
            }

            res.json({
                success: true,
                data: {
                    id: role.id,
                    name: role.name,
                    description: role.description,
                    isSystemRole: role.isSystemRole,
                    permissions: role.permissions.map((rp) => ({
                        id: rp.permission.id,
                        key: rp.permission.key,
                        name: rp.permission.name,
                        module: rp.permission.module,
                    })),
                    userCount: role._count.users,
                    createdAt: role.createdAt,
                    updatedAt: role.updatedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a role. System roles cannot be renamed but permissions can be adjusted.
     */
    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;
            const { name, description, permissionIds } = req.body;

            const role = await db.role.findFirst({ where: { id, tenantId } });
            if (!role) {
                throw new AppError(ERROR_CODES.ROLE_NOT_FOUND, 'Role not found', 404);
            }

            // System roles cannot be renamed
            if (role.isSystemRole && name && name !== role.name) {
                throw new AppError(ERROR_CODES.ROLE_IS_SYSTEM, 'System roles cannot be renamed', 400);
            }

            // Check name uniqueness if changing name
            if (name && name !== role.name) {
                const existing = await db.role.findUnique({
                    where: { tenantId_name: { tenantId, name } },
                });
                if (existing) {
                    throw new AppError(ERROR_CODES.ALREADY_EXISTS, 'A role with this name already exists', 409, 'name');
                }
            }

            // Validate permission IDs if provided
            if (permissionIds) {
                const permissions = await db.permission.findMany({
                    where: { id: { in: permissionIds } },
                });
                if (permissions.length !== permissionIds.length) {
                    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'One or more permission IDs are invalid', 400, 'permissionIds');
                }
            }

            await db.$transaction(async (tx) => {
                // Update role fields
                await tx.role.update({
                    where: { id },
                    data: {
                        ...(name && !role.isSystemRole ? { name } : {}),
                        ...(description !== undefined ? { description } : {}),
                    },
                });

                // Replace permissions if provided
                if (permissionIds) {
                    await tx.rolePermission.deleteMany({ where: { roleId: id } });
                    await tx.rolePermission.createMany({
                        data: permissionIds.map((permissionId: string) => ({
                            roleId: id,
                            permissionId,
                        })),
                    });
                }
            });

            // Fetch updated role
            const updated = await db.role.findUnique({
                where: { id },
                include: {
                    permissions: { include: { permission: true } },
                    _count: { select: { users: true } },
                },
            });

            res.json({
                success: true,
                data: {
                    id: updated!.id,
                    name: updated!.name,
                    description: updated!.description,
                    isSystemRole: updated!.isSystemRole,
                    permissions: updated!.permissions.map((rp) => ({
                        id: rp.permission.id,
                        key: rp.permission.key,
                        name: rp.permission.name,
                        module: rp.permission.module,
                    })),
                    userCount: updated!._count.users,
                    updatedAt: updated!.updatedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a custom role. System roles cannot be deleted.
     * Roles with assigned users cannot be deleted.
     */
    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const id = req.params.id!;

            const role = await db.role.findFirst({
                where: { id, tenantId },
                include: { _count: { select: { users: true } } },
            });

            if (!role) {
                throw new AppError(ERROR_CODES.ROLE_NOT_FOUND, 'Role not found', 404);
            }

            if (role.isSystemRole) {
                throw new AppError(ERROR_CODES.ROLE_IS_SYSTEM, 'System roles cannot be deleted', 400);
            }

            if (role._count.users > 0) {
                throw new AppError(ERROR_CODES.ROLE_HAS_USERS, 'Cannot delete a role that has assigned users. Reassign them first.', 400);
            }

            await db.role.delete({ where: { id } });

            res.json({
                success: true,
                data: { message: 'Role deleted successfully' },
            });
        } catch (error) {
            next(error);
        }
    }
}
