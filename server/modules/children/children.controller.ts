import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChildrenService } from './children.service';

@Controller('api/children')
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Get('mine')
  getMyChild(@Query('parentId') parentId: string) {
    return this.childrenService.getMyChild(parentId);
  }

  @Get(':id')
  getChildById(@Param('id') id: string) {
    return this.childrenService.getChildById(id);
  }
}
