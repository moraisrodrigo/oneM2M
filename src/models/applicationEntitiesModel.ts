import { ApplicationEntity, ShortName } from "../types";

export class ApplicationEntityModel extends ApplicationEntity implements BaseModelInterface<ApplicationEntity> {
    constructor(resourceName: string, resourceId: string) {
        super(resourceName, resourceId);
    }

    getDTO(): ApplicationEntity {
        return {
            [ShortName.Type]: this[ShortName.Type],
            [ShortName.ResourceName]: this[ShortName.ResourceName],
            [ShortName.ResourceID]: this[ShortName.ResourceID],
            [ShortName.CreationTime]: this[ShortName.CreationTime],
        }
    }
}