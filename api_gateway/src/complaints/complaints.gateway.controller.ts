import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiTags, ApiOperation, ApiBody, ApiParam,
  ApiQuery, ApiBearerAuth, ApiResponse,
} from '@nestjs/swagger';
import { Roles, CurrentUser } from '../auth/auth.decorators';
import { Role } from '../common/enums/roles.enum';

/**
 * Complaints HTTP Routes  (base: /api/complaints)
 *
 * RESIDENT routes:
 *   POST   /api/complaints/resident            Raise a complaint
 *   GET    /api/complaints/my                  View own complaints
 *   POST   /api/complaints/:id/close           Close after resolution + rating
 *
 * ADMIN_MAINTENANCE routes:
 *   POST   /api/complaints/admin               Raise on behalf of resident
 *   GET    /api/complaints                     List all complaints (with filters)
 *   POST   /api/complaints/:id/assign          Assign a worker
 *   PUT    /api/complaints/assignment/:id      Update assignment status
 *   POST   /api/complaints/assignment/:id/extra-charges    Add extra charges
 *   POST   /api/complaints/assignment/:id/approve-charges  Approve extra charges
 *   DELETE /api/complaints/:id                 Soft delete
 *   GET    /api/complaints/stats               Dashboard stats
 *
 * SHARED:
 *   GET    /api/complaints/:id                 Get complaint + assignment history
 *   GET    /api/complaints/worker/:workerId    Worker's task list
 */
@ApiTags('complaints')
@ApiBearerAuth()
@Controller('complaints')
export class ComplaintsGatewayController {
  constructor(
    @Inject('REPORTS_SERVICE') private readonly reports: ClientProxy,
  ) {}

  // ── Resident: raise complaint ─────────────────────────────────────────────

  @Roles(Role.RESIDENT)
  @Post('resident')
  @ApiOperation({
    summary: 'Resident raises a complaint',
    description: 'complaint_type: common (shared area) | individual (inside flat). Location auto-filled from resident profile.',
  })
  @ApiBody({
    schema: {
      properties: {
        complaint_type: { type: 'string', enum: ['common', 'individual'] },
        category: { type: 'string', example: 'Plumbing', description: 'Common: Plumbing, Electrical, Gardening, Lift, Painting, Cleaning, Security, Carpentry, Other | Individual: Plumbing, Electrical, Carpentry, Painting, Pest Control, Appliance Repair, Other' },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
        title: { type: 'string', example: 'Water leaking from bathroom ceiling' },
        description: { type: 'string', example: 'Continuous water drip from the top corner since morning.' },
        images: { type: 'array', items: { type: 'string' }, description: 'Optional image URLs' },
      },
      required: ['complaint_type', 'category', 'priority', 'title', 'description'],
    },
  })
  @ApiResponse({ status: 201, description: 'Complaint created with auto-generated ticket number (AMS-YYYY-XXXXX)' })
  createResidentComplaint(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(
      this.reports.send('complaints.create.resident', {
        user_id: user._id || user.id,
        profile: {
          resident_name: user.full_name,
          block: user.block || '',
          floor: user.floor || '',
          unit_number: user.unit_number || '',
        },
        dto: body,
      }),
    );
  }

  // ── Admin maintenance: raise complaint ────────────────────────────────────

  @Roles(Role.ADMIN_MAINTENANCE)
  @Post('admin')
  @ApiOperation({
    summary: 'Maintenance admin raises a complaint on behalf of a resident',
    description: 'Admin fills all location + resident details manually.',
  })
  @ApiBody({
    schema: {
      properties: {
        resident_name: { type: 'string', example: 'Sunita Sharma' },
        block: { type: 'string', example: 'A' },
        floor: { type: 'string', example: '3' },
        unit_number: { type: 'string', example: '301' },
        complaint_type: { type: 'string', enum: ['common', 'individual'] },
        category: { type: 'string', example: 'Lift' },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
        title: { type: 'string', example: 'Lift stuck on 2nd floor' },
        description: { type: 'string' },
        images: { type: 'array', items: { type: 'string' } },
      },
      required: ['resident_name', 'block', 'floor', 'unit_number', 'complaint_type', 'category', 'priority', 'title', 'description'],
    },
  })
  createAdminComplaint(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(
      this.reports.send('complaints.create.admin', {
        user_id: user._id || user.id,
        user_name: user.full_name,
        dto: body,
      }),
    );
  }

  // ── List all complaints (admin) ───────────────────────────────────────────

  @Roles(Role.ADMIN_MAINTENANCE, Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'List all complaints with optional filters (admin_maintenance)' })
  @ApiQuery({ name: 'status', required: false, enum: ['Open','Assigned','Accepted','In Progress','Resolved','Closed'] })
  @ApiQuery({ name: 'complaint_type', required: false, enum: ['common', 'individual'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['Low', 'Medium', 'High'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listAll(@CurrentUser() user: any, @Query() query: any) {
    return firstValueFrom(
      this.reports.send('complaints.list', {
        filter: query,
        user_id: user._id || user.id,
        user_role: user.role,
      }),
    );
  }

  // ── Resident: view own complaints ─────────────────────────────────────────

  @Roles(Role.RESIDENT)
  @Get('my')
  @ApiOperation({ summary: 'Resident views their own complaints' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMyComplaints(@CurrentUser() user: any, @Query() query: any) {
    return firstValueFrom(
      this.reports.send('complaints.list', {
        filter: query,
        user_id: user._id || user.id,
        user_role: user.role,   // 'resident' → service filters by raised_by_id
      }),
    );
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  @Roles(Role.ADMIN_MAINTENANCE, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('stats')
  @ApiOperation({ summary: 'Dashboard summary — complaints by status and priority' })
  getStats() {
    return firstValueFrom(this.reports.send('complaints.stats', {}));
  }

  // ── Worker task list ──────────────────────────────────────────────────────

  @Roles(Role.ADMIN_MAINTENANCE, Role.ADMIN)
  @Get('worker/:workerId')
  @ApiOperation({ summary: "Get all active assignments for a worker (their task list)" })
  @ApiParam({ name: 'workerId', description: 'Worker _id from auth service' })
  getWorkerAssignments(@Param('workerId') workerId: string) {
    return firstValueFrom(
      this.reports.send('complaints.worker_assignments', { worker_id: workerId }),
    );
  }

  // ── Assign worker ─────────────────────────────────────────────────────────

  @Roles(Role.ADMIN_MAINTENANCE)
  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign a worker to a complaint — status becomes Assigned' })
  @ApiParam({ name: 'id', description: 'Complaint _id' })
  @ApiBody({
    schema: {
      properties: {
        worker_id: { type: 'string', example: '665f1b2c3d4e5f6a7b8c9d0e', description: 'Worker _id from auth service' },
        worker_name: { type: 'string', example: 'Selvam Plumber' },
        worker_expertise: { type: 'string', example: 'Plumber' },
        scheduled_visit_date: { type: 'string', example: '2025-05-10', description: 'Optional planned visit date' },
      },
      required: ['worker_id', 'worker_name'],
    },
  })
  assignWorker(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return firstValueFrom(
      this.reports.send('complaints.assign_worker', {
        complaint_id: id,
        admin_id: user._id || user.id,
        admin_name: user.full_name,
        dto: body,
      }),
    );
  }

  // ── Update assignment status ──────────────────────────────────────────────

  @Roles(Role.ADMIN_MAINTENANCE, Role.ADMIN)
  @Put('assignment/:assignmentId')
  @ApiOperation({
    summary: 'Update assignment status',
    description: `Status flow:\n
    **Accepted** → worker accepted the job\n
    **Rejected** → worker rejected (must include rejection_reason → complaint goes back to Open)\n
    **In Progress** → worker started the work\n
    **Resolved** → worker finished (must include work_notes, optional completion_images)`,
  })
  @ApiParam({ name: 'assignmentId', description: 'Assignment _id' })
  @ApiBody({
    schema: {
      properties: {
        status: { type: 'string', enum: ['Accepted', 'Rejected', 'In Progress', 'Resolved'] },
        rejection_reason: { type: 'string', description: 'Required when status = Rejected' },
        work_notes: { type: 'string', description: 'Required when status = Resolved' },
        completion_images: { type: 'array', items: { type: 'string' }, description: 'Optional photos when Resolved' },
      },
      required: ['status'],
    },
  })
  updateAssignment(@Param('assignmentId') assignmentId: string, @Body() body: any) {
    return firstValueFrom(
      this.reports.send('complaints.update_assignment', { assignment_id: assignmentId, dto: body }),
    );
  }

  // ── Extra charges ─────────────────────────────────────────────────────────

  @Roles(Role.ADMIN_MAINTENANCE)
  @Post('assignment/:assignmentId/extra-charges')
  @ApiOperation({ summary: 'Submit extra charges for admin approval (spare parts, etc.)' })
  @ApiParam({ name: 'assignmentId' })
  @ApiBody({
    schema: {
      properties: {
        amount: { type: 'number', example: 450 },
        description: { type: 'string', example: 'Replaced copper pipe fitting (₹300) + labour (₹150)' },
      },
      required: ['amount', 'description'],
    },
  })
  addExtraCharges(@Param('assignmentId') id: string, @Body() body: any) {
    return firstValueFrom(
      this.reports.send('complaints.add_extra_charges', { assignment_id: id, dto: body }),
    );
  }

  @Roles(Role.ADMIN, Role.ADMIN_MAINTENANCE)
  @Post('assignment/:assignmentId/approve-charges')
  @ApiOperation({ summary: 'Admin approves extra charges submitted by worker' })
  @ApiParam({ name: 'assignmentId' })
  approveCharges(@Param('assignmentId') id: string) {
    return firstValueFrom(
      this.reports.send('complaints.approve_extra_charges', { assignment_id: id }),
    );
  }

  // ── Close complaint ───────────────────────────────────────────────────────

  @Roles(Role.RESIDENT, Role.ADMIN, Role.ADMIN_MAINTENANCE)
  @Post(':id/close')
  @ApiOperation({
    summary: 'Close a resolved complaint — optionally add rating',
    description: 'Complaint must be in Resolved status. Resident/admin confirms and optionally rates the work.',
  })
  @ApiParam({ name: 'id', description: 'Complaint _id' })
  @ApiBody({
    schema: {
      properties: {
        closure_remark: { type: 'string', example: 'Issue fully resolved, thank you!' },
        rating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
        rating_comment: { type: 'string', example: 'Very prompt service!' },
      },
    },
  })
  closeComplaint(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(
      this.reports.send('complaints.close', { complaint_id: id, dto: body }),
    );
  }

  // ── Get single complaint ──────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a complaint with full assignment history' })
  @ApiParam({ name: 'id', description: 'Complaint _id' })
  getById(@Param('id') id: string) {
    return firstValueFrom(
      this.reports.send('complaints.get_by_id', { complaint_id: id }),
    );
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  @Roles(Role.ADMIN_MAINTENANCE, Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a complaint (cannot delete if In Progress)' })
  @ApiParam({ name: 'id', description: 'Complaint _id' })
  delete(@Param('id') id: string) {
    return firstValueFrom(
      this.reports.send('complaints.delete', { complaint_id: id }),
    );
  }
}
