/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable, Logger } from '@nestjs/common';
import semver from 'semver';

interface ServiceInfo {
  name: string;
  timestamp: number;
  ip: string;
  port: number;
  version: string;
}

@Injectable()
export class ServiceRegistryService {
  private readonly logger = new Logger(ServiceRegistryService.name);

  // All registered services stored here
  private services: Record<string, ServiceInfo> = {};

  // Timeout for expiration (30 sec default)
  private timeout = 30;

  // Current timestamp helper
  private getTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  // Generates unique key for each service instance
  private generateKey(name: string, version: string, ip: string, port: number) {
    return `${name}:${version}:${ip}:${port}`;
  }

  // Register new service OR refresh if already registered
  register(
    name: string,
    version: string,
    ip: string,
    port: number,
  ): { key: string; message: string } {
    const key = this.generateKey(name, version, ip, port);

    if (!this.services[key]) {
      // New service entry
      this.services[key] = {
        name,
        timestamp: this.getTimestamp(),
        ip,
        port,
        version,
      };

      this.logger.debug(`Service added: ${key}`);

      return {
        key,
        message: 'Service successfully registered',
      };
    }

    // Already registered → Heartbeat refresh
    this.services[key].timestamp = this.getTimestamp();

    return {
      key,
      message: 'Service already registered — timestamp refreshed',
    };
  }

  // Remove inactive services
  cleanUp(): void {
    const now = this.getTimestamp();

    Object.keys(this.services).forEach((key) => {
      if (this.services[key].timestamp + this.timeout < now) {
        delete this.services[key];
        this.logger.debug(`Removed inactive service: ${key}`);
      }
    });
  }

  // Manually unregister service
  unRegister(
    name: string,
    version: string,
    ip: string,
    port: number,
  ): { key: string; message: string } {
    const key = this.generateKey(name, version, ip, port);

    delete this.services[key];
    this.logger.debug(`Service removed manually: ${key}`);

    return {
      key,
      message: 'Service removed',
    };
  }

  // Search service by name + version range
  search(name: string, version: string): any {
    this.cleanUp();

    const candidates = Object.values(this.services).filter(
      (service) =>
        service.name === name && semver.satisfies(service.version, version),
    );

    return candidates[Math.floor(Math.random() * candidates.length)];
  }
}
