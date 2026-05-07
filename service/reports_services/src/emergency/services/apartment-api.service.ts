import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class ApartmentApiService {
  private APART_URL = "http://localhost:3002/api/apartment";
  private AUTH_URL = "http://localhost:3001/api/authentication";
  private PAYMENT_URL = "http://localhost:3003/api/payment";

  async getBlocks() {
    return this.callApartment("blocks");
  }

  async getFloors() {
    return this.callApartment("floors");
  }

  async getFlats() {
    return this.callApartment("flats");
  }

  async getUnits(blockId: string) {
    return this.callApartment(`units/block/${blockId}`);
  }

  async getVisitors() {
    return this.callApartment("visitors");
  }

  async getUsers() {
    return this.callAuth("users");
  }

  async getStaff() {
    return this.callAuth("staff");
  }

  async getPayments() {
    return this.callPayment("payments");
  }

  async getBills() {
    return this.callPayment("bills");
  }

  async getReceipts() {
    return this.callPayment("receipts");
  }

  private async callApartment(endpoint: string) {
    try {
      const url = `${this.APART_URL}/${endpoint}`;
      const res = await axios.get(url);

      return Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
    } catch (error: any) {
      console.error(`Apartment API ${endpoint} failed:`, error.message);
      return [];
    }
  }

  private async callAuth(endpoint: string) {
    try {
      const url = `${this.AUTH_URL}/${endpoint}`;
      const res = await axios.get(url);

      return Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
    } catch (error: any) {
      console.error(`Auth API ${endpoint} failed:`, error.message);
      return [];
    }
  }

  private async callPayment(endpoint: string) {
    try {
      const url = `${this.PAYMENT_URL}/${endpoint}`;
      const res = await axios.get(url);

      return Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
    } catch (error: any) {
      console.error(`Payment API ${endpoint} failed:`, error.message);
      return [];
    }
  }
}