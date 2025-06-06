import { ApplicationEntity, ShortName } from "../types/index";
import { getTimestamp } from "../utils/misc";

export class ApplicationEntityModel extends ApplicationEntity {
    [ShortName.CreationTime]!: string;

    constructor(resourceName: string, resourceId: string) {
        super(resourceName, resourceId);
        this[ShortName.CreationTime] = getTimestamp();
        this[ShortName.LastModifiedTime] = '';
    }
}