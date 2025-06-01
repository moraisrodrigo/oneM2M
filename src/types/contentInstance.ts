import { getTimestamp } from "../utils/misc";
import { ShortName, ResourceType } from "./index";

export class ContentInstance {
    [ShortName.Type] = ResourceType.ContentInstance;
    [ShortName.ContentFormat]: string = "text/plain";
    [ShortName.ResourceName]!: string;
    [ShortName.ResourceID]!: string;
    [ShortName.CreationTime]!: string;
    [ShortName.Content]!: any;
    [ShortName.ParentId]!: string;

    constructor(resourceName: string, resourceId: string, content: any, parentId: string) {
        this[ShortName.ResourceName] = resourceName;
        this[ShortName.ResourceID] = resourceId;
        this[ShortName.CreationTime] = getTimestamp();
        this[ShortName.Content] = content;
        this[ShortName.ParentId] = parentId;
    }
}