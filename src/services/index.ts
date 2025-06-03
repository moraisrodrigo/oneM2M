import { getDB, saveDB } from '../db/index';
import { ShortName } from '../types/index';
import { ApplicationEntityModel, ContainerModel, ContentInstanceModel } from '../models/index';

export class Service {
    private db = getDB();

    private save(): void {
        saveDB(this.db);
    }

    createAE(resourceName: string, resourceId: string): ApplicationEntityModel | null {
        const applicationEntityFound = this.db.AEs.find((ae) => ae[ShortName.ResourceID] === resourceId || ae[ShortName.ResourceName] === resourceName);
        if (applicationEntityFound) return null;

        const newApplicationEntity = new ApplicationEntityModel(resourceName, resourceId);
        this.db.AEs.push(newApplicationEntity);

        this.save();

        return newApplicationEntity;
    }

    createContainer(
        resourceName: string,
        resourceId: string,
        parentApplicationEntityName: string
    ): ContainerModel | null {
        const applicationEntityFound = this.db.AEs.find((applicationEntity) => applicationEntity[ShortName.ResourceName] === parentApplicationEntityName);
        if (!applicationEntityFound) return null;

        const containerFound = this.db.containers.find((container) => container[ShortName.ParentId] === applicationEntityFound[ShortName.ResourceID]);
        // Check if the container already exists for the given parent application entity
        if (containerFound) return null;

        const newContainer = new ContainerModel(resourceName, resourceId, applicationEntityFound[ShortName.ResourceID]);
        this.db.containers.push(newContainer);

        this.save();

        return newContainer;
    }

    createContentInstance(
        resourceName: string,
        resourceId: string,
        parentContainerName: string,
        parentApplicationEntityName: string,
        content: any
    ): ContentInstanceModel | null {
        const applicationEntityFound = this.db.AEs.find((applicationEntity) => applicationEntity[ShortName.ResourceName] === parentApplicationEntityName);
        if (!applicationEntityFound) return null;

        const containerFound = this.db.containers.find((container) => container[ShortName.ParentId] === applicationEntityFound[ShortName.ResourceID] && container[ShortName.ResourceName] === parentContainerName);
        if (!containerFound) return null;

        const newContentInstance = new ContentInstanceModel(resourceName, resourceId, content, containerFound[ShortName.ResourceID]);
        this.db.contentInstances.push(newContentInstance);

        this.save();

        return newContentInstance;
    }

    getAEs(): ApplicationEntityModel[] {
        return this.db.AEs;
    }

    getAE(rn: String): ApplicationEntityModel|undefined {
        return this.db.AEs.find((ae) => ae.rn === rn);
    }

    getContainers(): ContainerModel[] {
        return this.db.containers;
    }

    getContentInstances(): ContentInstanceModel[] {
        return this.db.contentInstances;
    }
}