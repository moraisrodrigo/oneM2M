import { ContentInstance, ShortName } from "../types/index";

export class ContentInstanceModel extends ContentInstance {
    [ShortName.ParentId]!: string;

    constructor(resourceName: string, resourceId: string, content: any, parentContainerId: string) {
        super(resourceName, resourceId, content);
        this[ShortName.ParentId] = parentContainerId;
    }
}