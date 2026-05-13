import { Service } from "@tsed/di";
import { IncidentReport } from "../Entity/IncidentReport";

@Service()
export class IncidentReportService {
  async getAllIncidents(query: any) {
    return await IncidentReport.paginate(query, {
      relations: ["task", "task.product", "reporter"]
    });
  }

  async getIncidentById(id: number) {
    return await IncidentReport.getByIdOrFail(id, {
      relations: ["task", "task.product", "reporter"]
    });
  }

  async updateIncident(id: number, body: any) {
    const incident = await IncidentReport.getByIdOrFail(id);
    return await incident.update(body);
  }

  async deleteIncident(id: number) {
    const incident = await IncidentReport.getByIdOrFail(id);
    return await incident.softDelete();
  }
}
