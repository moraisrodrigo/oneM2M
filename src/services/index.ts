import { getDB, saveDB } from '../db/index';
import { ShortName } from '../types/index';
import { ApplicationEntity, Container, ContentInstance } from '../types';
import { getTimestamp } from '../utils/misc';

export class Service {
    private db = getDB();

    private save(): void {
        saveDB(this.db);
    }

    createAE(resourceName: string): ApplicationEntity | null {
        const applicationEntityFound = this.db.AEs.find((ae) => ae[ShortName.ResourceName] === resourceName);
        if (applicationEntityFound) return null;

        const newApplicationEntity = new ApplicationEntity
        (resourceName, getTimestamp());
        this.db.AEs.push(newApplicationEntity);

        this.save();

        return newApplicationEntity;
    }

    createContainer(
        resourceName: string,
        resourceId: string,
        parentApplicationEntityName: string
    ): Container | null {
        const applicationEntityFound = this.db.AEs.find((applicationEntity) => applicationEntity[ShortName.ResourceName] === parentApplicationEntityName);
        // Check if the application entity exists
        if (!applicationEntityFound) return null;

        const containerFound = this.db.containers.find((container) => container[ShortName.ParentId] === applicationEntityFound[ShortName.ResourceID]);
        // Check if the container already exists for the given parent application entity
        if (containerFound) return null;

        const newContainer = new Container(resourceName, resourceId, applicationEntityFound[ShortName.ResourceID]);
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
    ): ContentInstance | null {
        const applicationEntityFound = this.db.AEs.find((applicationEntity) => applicationEntity[ShortName.ResourceName] === parentApplicationEntityName);
        // Check if the application entity exists
        if (!applicationEntityFound) return null;

        const containerFound = this.db.containers.find((container) => container[ShortName.ParentId] === applicationEntityFound[ShortName.ResourceID] && container[ShortName.ResourceName] === parentContainerName);
        // Check if the container exists for the given parent application entity
        if (!containerFound) return null;

        const newContentInstance = new ContentInstance(resourceName, resourceId, content, containerFound[ShortName.ResourceID]);
        this.db.contentInstances.push(newContentInstance);

        this.save();

        return newContentInstance;
    }

    getAEs(): ApplicationEntity[] {
        return this.db.AEs;
    }

    getAE(rn: String): ApplicationEntityModel|undefined {
        return this.db.AEs.find((ae) => ae.rn === rn);
    }

    getAEByResourceId(ri: String): ApplicationEntityModel|undefined {
        return this.db.AEs.find((ae) => ae.ri === ri);
    }

    getContainers(): ContainerModel[] {
        return this.db.containers;
    }

    getContainer(rn: String): ContainerModel|undefined {
        return this.db.containers.find((container) => container.rn === rn);
    }

    getContainersByParentId(pi: String): ContainerModel[] {
        return this.db.containers.filter(container => container[ShortName.ParentId] === pi);
    }

    getContainerByResourceId(ri: String): ContainerModel|undefined {
        return this.db.containers.find((container) => container[ShortName.ResourceID] === ri);
    }

    getContentInstances(): ContentInstanceModel[] {
        return this.db.contentInstances;
    }

    getContentInstancesByParentId(pi: String): ContentInstanceModel[] {
        return this.db.contentInstances.filter(contentInstance => contentInstance[ShortName.ParentId] === pi);
    }
}