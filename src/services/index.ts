import {
    ApplicationEntity,
    Container,
    ContentInstance,
    DBType,
    ShortName,
} from '../types';
import { ApplicationEntityModel } from '../models/applicationEntitiesModel';
import { getDB, saveDB } from '../db';
import { ContainerModel } from '../models/containersModel';

export class Service {
    private db: DBType = getDB();

    private save(): void {
        saveDB(this.db);
    }

    createAE(resourceName: string, resourceId: string): ApplicationEntity | null {
        const applicationEntityFound = this.db.AEs.find((ae) => ae[ShortName.ResourceID] === resourceId || ae[ShortName.ResourceName] === resourceName);
        if (applicationEntityFound) return null;

        const newApplicationEntity = new ApplicationEntityModel(resourceName, resourceId);
        this.db.AEs.push(newApplicationEntity);

        this.save();

        return newApplicationEntity.getDTO();
    }

    createContainer(resourceName: string, resourceId: string, parentApplicationEntityName: string): Container | null {
        const applicationEntityFound = this.db.AEs.find((applicationEntity) => applicationEntity[ShortName.ResourceName] === parentApplicationEntityName);
        if (!applicationEntityFound) return null;

        
        const containerFound = this.db.containers.find((container) => container[ShortName.ParentId] === applicationEntityFound[ShortName.ResourceID] && container);
        if (containerFound) return null;

        const newContainer = new ContainerModel(resourceName, resourceId, applicationEntityFound[ShortName.ResourceID]);
        this.db.containers.push(newContainer);

        this.save();

        return newContainer;
    }
}