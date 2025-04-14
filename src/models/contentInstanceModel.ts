import { ContentInstance, ShortName } from "../types/index";
import { getTimestamp } from "../utils/misc";

export class ContentInstanceModel extends ContentInstance {
    [ShortName.ParentId]!: string;
    [ShortName.CreationTime]!: string;

    constructor(resourceName: string, resourceId: string, content: any, parentContainerId: string) {
        super(resourceName, resourceId, content);
        this[ShortName.ParentId] = parentContainerId;
        this[ShortName.CreationTime] = getTimestamp();
    }
}