import { Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { Response } from "express";
import { KafkaService } from "../kafka/kafka.service";

@Injectable()
export class ReportService {
  constructor(private readonly kafkaService: KafkaService) { }

  applyFilters(data: any[], filters: any) {
    return data.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.priority && item.priority !== filters.priority) return false;
      if (filters.block_id && item.block_id != filters.block_id) return false;
      if (filters.block_id && item.block_id?.toString() !== filters.block_id) return false;

      const dateField = item.createdAt || item.time;

      if (filters.startDate && new Date(dateField) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(dateField) > new Date(filters.endDate)) return false;

      return true;
    });
  }


  async addSheet(
    workbook: ExcelJS.Workbook,
    name: string,
    columns: any[],
    data: any[],
    kafkaTopic: string,
  ) {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns;

    for (const item of data) {
      sheet.addRow(item);

      await this.kafkaService.sendEvent(kafkaTopic, item);
    }
  }

  async generateFullReport(data: any, filters: any, res: Response) {
    const workbook = new ExcelJS.Workbook();

    await this.addSheet(
      workbook,
      "Blocks",
      [
        { header: "Block Name", key: "block_name", width: 25 },
        { header: "Block Code", key: "block_code", width: 20 },
        { header: "Address", key: "address", width: 30 },
        { header: "Total Floors", key: "total_floors", width: 15 },
      ],
      this.applyFilters(data.blocks, filters),
      "report-block",
    );

    await this.addSheet(
      workbook,
      "Floors",
      [
        { header: "Block ID", key: "block_id", width: 25 },
        { header: "Floor Number", key: "floor_number", width: 15 },
      ],
      this.applyFilters(data.floors, filters),
      "report-floor",
    );

    await this.addSheet(
      workbook,
      "Flats",
      [
        { header: "Flat Number", key: "flat_number", width: 20 },
        { header: "Status", key: "status", width: 15 },
      ],
      this.applyFilters(data.flats, filters),
      "report-flat",
    );

    await this.addSheet(
      workbook,
      "Units",
      [
        { header: "Unit Number", key: "unit_number", width: 20 },
        { header: "Floor", key: "floor", width: 10 },
        { header: "Rent", key: "rent", width: 15 },
      ],
      this.applyFilters(data.units, filters),
      "report-unit",
    );

    await this.addSheet(
      workbook,
      "Complaints",
      [
        { header: "User ID", key: "user_id", width: 20 },
        { header: "Complaint ID", key: "complaint_id", width: 20 },
        { header: "Category", key: "category", width: 20 },
        { header: "Description", key: "description", width: 25 },
        { header: "Priority", key: "priority", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Created At", key: "createdAt", width: 25 },
      ],
      this.applyFilters(data.complaints, filters),
      "report-complaint",
    );

    await this.addSheet(
      workbook,
      "Emergency",
      [
        { header: "Type", key: "type", width: 20 },
        { header: "Alert ID", key: "alertId", width: 20 },
        { header: "Priority", key: "priority", width: 15 },
        { header: "Location", key: "location", width: 15 },
        { header: "Raised by", key: "raisedBy", width: 15 },
        { header: "Time", key: "time", width: 15 },
        { header: "Acknowledged", key: "acknowledged", width: 15 },
        { header: "Total", key: "total", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Message", key: "message", width: 25 },
      ],
      this.applyFilters(data.emergencies, filters),
      "report-emergency",
    );

    await this.addSheet(
      workbook,
      "Visitors",
      [
        { header: "Resident ID", key: "resident_id", width: 25 },
        { header: "Name", key: "name", width: 20 },
        { header: "Mobile", key: "mobile", width: 20 },
        { header: "Visit Date", key: "visit_date", width: 20 },
        { header: "Visit Time", key: "visit_time", width: 15 },
        { header: "Entry Time", key: "entry_time", width: 25 },
        { header: "Exit Time", key: "exit_time", width: 25 },
        { header: "Status", key: "status", width: 15 },
        { header: "Type", key: "type", width: 15 },
      ],
      this.applyFilters(data.visitors, filters),
      "report-visitor",
    );

    await this.addSheet(
      workbook,
      "Users",
      [
        { header: "Name", key: "name", width: 20 },
        { header: "Email", key: "email", width: 25 },
        { header: "Phone", key: "phone", width: 20 },
        { header: "Role ID", key: "roleid", width: 25 },
        { header: "Active", key: "is_active", width: 10 },
      ],
      this.applyFilters(data.users, filters),
      "report-user",
    );

    await this.addSheet(
      workbook,
      "Staff",
      [
        { header: "User ID", key: "user_id", width: 25 },
        { header: "Staff Type", key: "staff_type", width: 20 },
        { header: "Employee ID", key: "employee_id", width: 20 },
        { header: "Expertise", key: "expertise", width: 20 },
        { header: "Assigned Gate", key: "assigned_gate", width: 20 },
        { header: "Shift Start", key: "shift_start", width: 15 },
        { header: "Shift End", key: "shift_end", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ],
      this.applyFilters(data.staff, filters),
      "report-staff",
    );

    await this.addSheet(
  workbook,
  "Payments",
  [
    { header: "Bill ID", key: "bill_id", width: 25 },
    { header: "Resident ID", key: "resident_id", width: 25 },
    { header: "Payment Mode", key: "payment_mode", width: 15 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Transaction ID", key: "transaction_id", width: 25 },
    { header: "Status", key: "status", width: 15 },
  ],
  this.applyFilters(data.payments, filters),
  "report-payment",
);

await this.addSheet(
  workbook,
  "Bills",
  [
    { header: "Resident ID", key: "resident_id", width: 25 },
    { header: "Month", key: "month", width: 20 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Extra Charges", key: "extra_charges", width: 15 },
    { header: "Paid Amount", key: "paid_amount", width: 15 },
    { header: "Due Date", key: "due_date", width: 20 },
    { header: "Status", key: "status", width: 15 }, 
  ],
  this.applyFilters(data.bills, filters),
  "report-bill",
);

await this.addSheet(
  workbook,
  "Receipts",
  [
    { header: "Payment ID", key: "payment_id", width: 25 },
    { header: "Receipt Number", key: "receipt_number", width: 25 },
    { header: "Receipt Date", key: "receipt_date", width: 20 },
  ],
  this.applyFilters(data.receipts, filters),
  "report-receipt",
);

    return this.sendExcel(workbook, res, "full-report.xlsx");
  }

  async generateSingleReport(
    name: string,
    columns: any[],
    data: any[],
    filters: any,
    topic: string,
    res: Response,
  ) {
    const workbook = new ExcelJS.Workbook();

    await this.addSheet(
      workbook,
      name,
      columns,
      this.applyFilters(data, filters),
      topic,
    );

    return this.sendExcel(workbook, res, `${name.toLowerCase()}-report.xlsx`);
  }

  async sendExcel(workbook: ExcelJS.Workbook, res: Response, filename: string) {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${filename}`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}