import { WidgetType } from '../types';
import { WidgetDefinition, WidgetCategory } from './types';

class WidgetRegistryService {
  private widgets: Map<WidgetType, WidgetDefinition> = new Map();

  register(definition: WidgetDefinition) {
    this.widgets.set(definition.type, definition);
  }

  get(type: WidgetType): WidgetDefinition | undefined {
    return this.widgets.get(type);
  }

  getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    return this.getAll().filter((w) => w.category === category);
  }

  getDefaultSettings(type: WidgetType): Record<string, any> {
    const def = this.get(type);
    if (!def) return {};
    return def.settings.reduce((acc, setting) => {
      acc[setting.id] = setting.defaultValue;
      return acc;
    }, {} as Record<string, any>);
  }
}

export const WidgetRegistry = new WidgetRegistryService();
