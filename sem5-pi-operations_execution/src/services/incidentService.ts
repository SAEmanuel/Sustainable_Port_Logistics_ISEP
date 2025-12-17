import {Inject, Service} from "typedi";
import IIncidentService from "./IServices/IIncidentService";
import IIncidentRepo from "./IRepos/IIncidentRepo";
import IncidentMap from "../mappers/IncidentMap";
import {Logger} from "winston";

@Service()
export default class IncidentService implements IIncidentService {

    constructor(
        @Inject("incidentRepo")
        private repo : IIncidentRepo,
        @Inject("IncidentMap")
        private incidentMap: IncidentMap,
        @Inject("logger")
        private logger: Logger,
    ) {}


}