const fs = require('fs');
const path = require('path');

const servicePath = path.resolve(__dirname, '../../Backend/src/modules/upload/upload.service.ts');
const controllerPath = path.resolve(__dirname, '../../Backend/src/modules/upload/upload.controller.ts');

console.log('Patching Backend upload module...');

// 1. Patch upload.service.ts
let serviceContent = fs.readFileSync(servicePath, 'utf8');
if (!serviceContent.includes('uploadProgramImage(')) {
  const programServiceMethod = `
  /**
   * Upload a program image (thumbnail or content block image) to ImageKit.
   * Folder structure: vdcd/programs/<slug>
   * If slug/title is not provided or empty, a random string is generated for the subfolder.
   */
  async uploadProgramImage(
    file: Express.Multer.File,
    uploadedBy?: string,
    slugOrTitle?: string,
  ): Promise<UploadResult> {
    let cleanSlug = this.sanitizeSubfolder(slugOrTitle);
    if (!cleanSlug) {
      cleanSlug = randomUUID().replace(/-/g, '').slice(0, 10);
    }
    const folder = \`programs/\${cleanSlug}\`;
    return this.uploadImage(file, folder, uploadedBy);
  }
`;

  serviceContent = serviceContent.replace(
    'async uploadPartnerLogo(file: Express.Multer.File, uploadedBy?: string) {',
    `${programServiceMethod}\n  async uploadPartnerLogo(file: Express.Multer.File, uploadedBy?: string) {`
  );

  fs.writeFileSync(servicePath, serviceContent, 'utf8');
  console.log('✓ Successfully patched upload.service.ts');
} else {
  console.log('upload.service.ts already has uploadProgramImage');
}

// 2. Patch upload.controller.ts
let controllerContent = fs.readFileSync(controllerPath, 'utf8');
if (!controllerContent.includes('uploadProgramImage(')) {
  const programControllerMethods = `
  @Post('image/program')
  @Roles('superadmin', 'editor')
  @ApiBearerAuth()
  @UseInterceptors(memoryUpload())
  @ApiOperation({
    summary: 'Upload image for program',
    description:
      'Upload an image for a program to ImageKit under "vdcd/programs/<slug>". If no slug or title is provided, a random subfolder is generated.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  @ApiQuery({
    name: 'slug',
    required: false,
    description: 'Program slug (e.g. "uom-tao-khoi-nghiep")',
    example: 'uom-tao-khoi-nghiep',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Program title to be slugified if slug is not provided',
    example: 'Chương trình ươm tạo',
  })
  @ApiQuery({
    name: 'subfolder',
    required: false,
    description: 'Subfolder name or slug',
    example: 'uom-tao-khoi-nghiep',
  })
  @ApiResponse({
    status: 201,
    description: 'Program image uploaded successfully.',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size.' })
  uploadProgramImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Query('slug') slugQuery?: string,
    @Query('title') titleQuery?: string,
    @Query('subfolder') subfolderQuery?: string,
    @Body('slug') slugBody?: string,
    @Body('title') titleBody?: string,
    @Body('subfolder') subfolderBody?: string,
  ) {
    const slugOrTitle =
      slugQuery ||
      titleQuery ||
      subfolderQuery ||
      slugBody ||
      titleBody ||
      subfolderBody;
    return this.service.uploadProgramImage(
      file,
      req.user?.id as string | undefined,
      slugOrTitle,
    );
  }

  @Post('image/program/:slug')
  @Roles('superadmin', 'editor')
  @ApiBearerAuth()
  @UseInterceptors(memoryUpload())
  @ApiOperation({
    summary: 'Upload image for program under specific slug',
    description:
      'Upload an image for a program to ImageKit under "vdcd/programs/<slug>".',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  @ApiParam({
    name: 'slug',
    description: 'Program slug (e.g. "uom-tao-khoi-nghiep")',
    example: 'uom-tao-khoi-nghiep',
  })
  @ApiResponse({
    status: 201,
    description: 'Program image uploaded successfully.',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size.' })
  uploadProgramImageWithSlug(
    @UploadedFile() file: Express.Multer.File,
    @Param('slug') slug: string,
    @Request() req,
  ) {
    return this.service.uploadProgramImage(
      file,
      req.user?.id as string | undefined,
      slug,
    );
  }
`;

  controllerContent = controllerContent.replace(
    "@Post('image/partner')",
    `${programControllerMethods}\n  @Post('image/partner')`
  );

  fs.writeFileSync(controllerPath, controllerContent, 'utf8');
  console.log('✓ Successfully patched upload.controller.ts');
} else {
  console.log('upload.controller.ts already has uploadProgramImage');
}
