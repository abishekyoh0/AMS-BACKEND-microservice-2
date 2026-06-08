import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('visitors')
@ApiBearerAuth()
@Controller('apartment/visitors')
export class VisitorsGatewayController {
    constructor(@Inject('APARTMENT_SERVICE') private readonly apartment: ClientProxy) { }

    @Post()
    create(@Body() body: any) {
        return firstValueFrom(this.apartment.send('visitor.create', body));
    }

    @Get()
    findAll() {
        return firstValueFrom(this.apartment.send('visitor.findAll', {}));
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return firstValueFrom(this.apartment.send('visitor.findOne', { id }));
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() body: any) {
        return firstValueFrom(this.apartment.send('visitor.updateStatus', { id, status: body.status }));
    }

    @Patch(':id/entry')
    markEntry(@Param('id') id: string) {
        return firstValueFrom(this.apartment.send('visitor.markEntry', { id }));
    }

    @Patch(':id/exit')
    markExit(@Param('id') id: string) {
        return firstValueFrom(this.apartment.send('visitor.markExit', { id }));
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return firstValueFrom(this.apartment.send('visitor.delete', { id }));
    }
}