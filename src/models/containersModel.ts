import { Container, ShortName } from "../types/index.js";

export class ContainerModel extends Container {
    [ShortName.ParentId]!: string;

    constructor(resourceName: string, resourceId: string, parentApplicationEntityId: string) {
        super(resourceName, resourceId);
        this[ShortName.ParentId] = parentApplicationEntityId;
    }
}