import { Injectable, OnModuleInit } from "@nestjs/common";
import { Kafka } from "kafkajs";

@Injectable()
export class KafkaService implements OnModuleInit {
  private producer: any;
  private isConnected = false;

  async onModuleInit() {
    try {
      const kafka = new Kafka({
        clientId: "ams-service",
        brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
      });

      this.producer = kafka.producer();
      await this.producer.connect();

      this.isConnected = true;
      console.log("Kafka connected");
    } catch (error) {
      console.log("Kafka not running");
      this.isConnected = false;
    }
  }

  async sendEvent(topic: string, message: any) {
    if (!this.isConnected) return;

    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }
}