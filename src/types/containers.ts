import { getTimestamp } from "../utils/misc";
import { ShortName, ResourceType } from "./index";

export class Container {
    [ShortName.Type] = ResourceType.Container;
    [ShortName.ResourceName]!: string;
    [ShortName.ResourceID]!: string;
    [ShortName.CreationTime]!: string;
    [ShortName.LastModifiedTime]!: string;
    [ShortName.ParentId]!: string;

    constructor(resourceName: string, resourceId: string, parentId: string) {
        this[ShortName.ResourceName] = resourceName;
        this[ShortName.ResourceID] = resourceId;
        this[ShortName.CreationTime] = getTimestamp();
        this[ShortName.LastModifiedTime] = '';
        this[ShortName.ParentId] = parentId;
    }
}