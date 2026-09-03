export const C_DECODER_ADMIN = {
  id: 'c-decoder-admin',
  code: 'C_MOD_DECODER',
  title: 'Decoder Manager',
  description: 'JavaScript payload decoder management and test sandbox by SKU and firmware version.',
};

export * from './entities/decoder.entity';
export * from './dto/decoder.dto';
export * from './decoder.service';
export * from './decoder.controller';
export * from './decoder.module';
