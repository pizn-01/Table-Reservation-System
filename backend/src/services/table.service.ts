import { supabaseAdmin } from '../config/database';
import { AppError, NotFoundError } from '../middleware/errorHandler';
import { CreateTableDto, UpdateTableDto, CreateAreaDto, UpdateAreaDto } from '../types/api.types';

export class TableService {
  // ─── Floor Areas ──────────────────────────────────────

  async listAreas(restaurantId: string) {
    const { data, error } = await supabaseAdmin
      .from('floor_areas')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw new AppError('Failed to fetch areas', 500);
    return (data || []).map(this.formatArea);
  }

  async createArea(restaurantId: string, dto: CreateAreaDto) {
    const { data, error } = await supabaseAdmin
      .from('floor_areas')
      .insert({
        restaurant_id: restaurantId,
        name: dto.name,
        display_order: dto.displayOrder || 0,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create area', 500);
    return this.formatArea(data);
  }

  async updateArea(areaId: string, restaurantId: string, dto: UpdateAreaDto) {
    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.displayOrder !== undefined) updateData.display_order = dto.displayOrder;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

    const { data, error } = await supabaseAdmin
      .from('floor_areas')
      .update(updateData)
      .eq('id', areaId)
      .eq('restaurant_id', restaurantId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError('Area');
    return this.formatArea(data);
  }

  async deleteArea(areaId: string, restaurantId: string) {
    const { error } = await supabaseAdmin
      .from('floor_areas')
      .update({ is_active: false })
      .eq('id', areaId)
      .eq('restaurant_id', restaurantId);

    if (error) throw new AppError('Failed to delete area', 500);
    return { success: true };
  }

  // ─── Tables ───────────────────────────────────────────

  async listTables(restaurantId: string) {
    const { data, error } = await supabaseAdmin
      .from('tables')
      .select('*, floor_areas(id, name)')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('table_number', { ascending: true });

    if (error) throw new AppError('Failed to fetch tables', 500);
    return (data || []).map(this.formatTable);
  }

  async getTable(tableId: string, restaurantId: string) {
    const { data, error } = await supabaseAdmin
      .from('tables')
      .select('*, floor_areas(id, name)')
      .eq('id', tableId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (error || !data) throw new NotFoundError('Table');
    return this.formatTable(data);
  }

  async createTable(restaurantId: string, dto: CreateTableDto) {
    const { data, error } = await supabaseAdmin
      .from('tables')
      .insert({
        restaurant_id: restaurantId,
        table_number: dto.tableNumber,
        name: dto.name || `Table ${dto.tableNumber}`,
        capacity: dto.capacity,
        min_capacity: dto.minCapacity || 1,
        area_id: dto.areaId || null,
        shape: dto.shape || 'rectangle',
        type: dto.type || null,
        is_mergeable: dto.isMergeable || false,
        position_x: dto.positionX || null,
        position_y: dto.positionY || null,
        merge_group_id: dto.mergeGroupId || null,
        split_parent_id: dto.splitParentId || null,
        width: dto.width || 135,
        height: dto.height || 100,
      })
      .select('*, floor_areas(id, name)')
      .single();

    if (error) throw new AppError(`Failed to create table: ${error.message}`, 500);
    return this.formatTable(data);
  }

  async updateTable(tableId: string, restaurantId: string, dto: UpdateTableDto) {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    if (dto.tableNumber !== undefined) updateData.table_number = dto.tableNumber;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.minCapacity !== undefined) updateData.min_capacity = dto.minCapacity;
    if (dto.areaId !== undefined) updateData.area_id = dto.areaId;
    if (dto.shape !== undefined) updateData.shape = dto.shape;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.isMergeable !== undefined) updateData.is_mergeable = dto.isMergeable;
    if (dto.positionX !== undefined) updateData.position_x = dto.positionX;
    if (dto.positionY !== undefined) updateData.position_y = dto.positionY;
    if (dto.mergeGroupId !== undefined) updateData.merge_group_id = dto.mergeGroupId;
    if (dto.splitParentId !== undefined) updateData.split_parent_id = dto.splitParentId;
    if (dto.width !== undefined) updateData.width = dto.width;
    if (dto.height !== undefined) updateData.height = dto.height;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;

    const { data, error } = await supabaseAdmin
      .from('tables')
      .update(updateData)
      .eq('id', tableId)
      .eq('restaurant_id', restaurantId)
      .select('*, floor_areas(id, name)')
      .single();

    if (error || !data) throw new NotFoundError('Table');
    return this.formatTable(data);
  }

  async deleteTable(tableId: string, restaurantId: string) {
    const { error } = await supabaseAdmin
      .from('tables')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', tableId)
      .eq('restaurant_id', restaurantId);

    if (error) throw new AppError('Failed to delete table', 500);
    return { success: true };
  }

  /**
   * Bulk import tables from parsed CSV data.
   */
  async importTables(
    restaurantId: string,
    tables: {
      tableNumber: string;
      capacity: number;
      area: string;
      type: string;
      positionX?: number;
      positionY?: number;
      isMergeable?: boolean;
      width?: number;
      height?: number;
    }[]
  ) {
    // First, ensure all areas exist
    const areaNames = [...new Set(tables.map((t) => t.area))];
    const areaMap: Record<string, string> = {};

    for (const areaName of areaNames) {
      if (!areaName) continue;

      // Check if area exists
      const { data: existing } = await supabaseAdmin
        .from('floor_areas')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('name', areaName)
        .single();

      if (existing) {
        areaMap[areaName] = existing.id;
      } else {
        // Create area
        const { data: newArea } = await supabaseAdmin
          .from('floor_areas')
          .insert({ restaurant_id: restaurantId, name: areaName })
          .select()
          .single();

        if (newArea) {
          areaMap[areaName] = newArea.id;
        }
      }
    }

    const tableRecords = tables.map((t) => ({
      restaurant_id: restaurantId,
      table_number: t.tableNumber,
      name: `Table ${t.tableNumber.replace('#', '')}`,
      capacity: t.capacity,
      area_id: areaMap[t.area] || null,
      type: t.type || null,
      position_x: t.positionX ?? null,
      position_y: t.positionY ?? null,
      is_mergeable: t.isMergeable ?? false,
      width: t.width ?? 135,
      height: t.height ?? 100,
    }));

    const { data, error } = await supabaseAdmin
      .from('tables')
      .upsert(tableRecords, { onConflict: 'restaurant_id,table_number' })
      .select('*, floor_areas(id, name)');

    if (error) throw new AppError(`Failed to import tables: ${error.message}`, 500);
    return (data || []).map(this.formatTable);
  }

  // ─── Formatters ───────────────────────────────────────

  private formatTable(row: any) {
    return {
      id: row.id,
      tableNumber: row.table_number,
      name: row.name,
      capacity: row.capacity,
      minCapacity: row.min_capacity,
      area: row.floor_areas ? { id: row.floor_areas.id, name: row.floor_areas.name } : null,
      shape: row.shape,
      type: row.type,
      isMergeable: row.is_mergeable,
      positionX: row.position_x,
      positionY: row.position_y,
      mergeGroupId: row.merge_group_id,
      splitParentId: row.split_parent_id,
      width: row.width || 135,
      height: row.height || 100,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Batch update table positions (for drag-and-drop).
   */
  async batchUpdatePositions(
    restaurantId: string,
    positions: { id: string; positionX: number; positionY: number }[]
  ) {
    const results = [];
    for (const pos of positions) {
      const { data, error } = await supabaseAdmin
        .from('tables')
        .update({
          position_x: pos.positionX,
          position_y: pos.positionY,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pos.id)
        .eq('restaurant_id', restaurantId)
        .select('id')
        .single();

      if (error) {
        console.error(`Failed to update position for table ${pos.id}:`, error.message);
      } else {
        results.push(data);
      }
    }
    return { updated: results.length };
  }

  private formatArea(row: any) {
    return {
      id: row.id,
      name: row.name,
      displayOrder: row.display_order,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  }
}

export const tableService = new TableService();
