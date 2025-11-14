/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Delete, Get, Param, Put, Req } from '@nestjs/common';
import { ServiceRegistryService } from './service-registry.service';
import type { Request } from 'express';

@Controller('service-registry')
export class ServiceRegistryController {
  constructor(
    private readonly serviceRegistryService: ServiceRegistryService,
  ) {}

  private getIpAdress(@Req() request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];

    const ip =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : (request.socket.remoteAddress ?? 'unknown');

    // normalize IPv6
    return ip.includes('::') ? `[${ip}]` : ip;
  }

  @Put('')
  registerService(
    @Req() request: Request,
    @Body('name') name: string,
    @Body('version') version: string,
    @Body('port') port: number,
  ) {
    const ip = this.getIpAdress(request);

    return this.serviceRegistryService.register(name, version, ip, port);
  }

  @Delete('')
  unregisterService(
    @Req() request: Request,
    @Body('name') name: string,
    @Body('version') version: string,
    @Body('port') port: number,
  ) {
    const ip = this.getIpAdress(request);

    return this.serviceRegistryService.unRegister(name, version, ip, port);
  }

  @Get('find/:name/:version')
  searchService(
    @Param('name') name: string,
    @Param('version') version: string,
  ): any {
    const service = this.serviceRegistryService.search(name, version);

    if (!service) {
      return { message: 'Service not found' };
    }

    return {
      name: service.name,
      ip: service.ip,
      port: service.port,
      version: service.version,
      timestamp: service.timestamp,
    };
  }
}
