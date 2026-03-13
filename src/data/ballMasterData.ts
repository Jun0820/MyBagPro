export interface BallModel {
  id: string;
  name: string;
}

export interface BallBrand {
  id: string;
  name: string;
  models: BallModel[];
}

export const BALL_MASTER_DATA: BallBrand[] = [
  {
    id: 'titleist',
    name: 'Titleist',
    models: [
      { id: 'prov1', name: 'Pro V1' },
      { id: 'prov1x', name: 'Pro V1x' },
      { id: 'avx', name: 'AVX' },
      { id: 'tour_soft', name: 'Tour Soft' },
      { id: 'velocity', name: 'Velocity' },
      { id: 'trufeel', name: 'TruFeel' },
      { id: 'unknown', name: 'わからない・相談したい' },
    ],
  },
  {
    id: 'taylormade',
    name: 'TaylorMade',
    models: [
      { id: 'tp5', name: 'TP5' },
      { id: 'tp5x', name: 'TP5x' },
      { id: 'tp5_pix', name: 'TP5 pix' },
      { id: 'soft_response', name: 'Soft Response' },
      { id: 'tour_response', name: 'Tour Response' },
      { id: 'distance_plus', name: 'Distance+' },
      { id: 'unknown', name: 'わからない・相談したい' },
    ],
  },
  {
    id: 'callaway',
    name: 'Callaway',
    models: [
      { id: 'chrome_tour', name: 'Chrome Tour' },
      { id: 'chrome_tour_x', name: 'Chrome Tour X' },
      { id: 'chrome_soft', name: 'Chrome Soft' },
      { id: 'erc_soft', name: 'ERC Soft' },
      { id: 'supersoft', name: 'Supersoft' },
      { id: 'warbird', name: 'Warbird' },
      { id: 'unknown', name: 'わからない・相談したい' },
    ],
  },
  {
    id: 'srixon',
    name: 'SRIXON',
    models: [
      { id: 'z_star', name: 'Z-STAR' },
      { id: 'z_star_xv', name: 'Z-STAR XV' },
      { id: 'z_star_diamond', name: 'Z-STAR ♦ (Diamond)' },
      { id: 'ad_speed', name: 'AD-SPEED' },
      { id: 'tri_star', name: 'TRI-STAR' },
      { id: 'soft_feel', name: 'Soft Feel' },
      { id: 'unknown', name: 'わからない・相談したい' },
    ],
  },
  {
    id: 'bridgestone',
    name: 'Bridgestone',
    models: [
      { id: 'tour_b_x', name: 'TOUR B X' },
      { id: 'tour_b_xs', name: 'TOUR B XS' },
      { id: 'tour_b_rx', name: 'TOUR B RX' },
      { id: 'tour_b_rxs', name: 'TOUR B RXS' },
      { id: 'phyz', name: 'PHYZ' },
      { id: 'unknown', name: 'わからない・相談したい' },
    ],
  },
  {
    id: 'honma',
    name: 'HONMA',
    models: [
      { id: 'tw_x', name: 'TW-X' },
      { id: 'tw_s', name: 'TW-S' },
      { id: 'd1', name: 'D1' },
      { id: 'unknown', name: 'わからない・相談したい' },
    ],
  },
  {
    id: 'mizuno',
    name: 'MIZUNO',
    models: [
      { id: 'rb_tour', name: 'RB TOUR' },
      { id: 'rb_tour_x', name: 'RB TOUR X' },
      { id: 'rb_566', name: 'RB 566' },
      { id: 'unknown', name: 'わからない・相談したい' },
    ],
  },
  {
    id: 'other',
    name: 'その他',
    models: [
      { id: 'other_model', name: 'その他モデル' },
      { id: 'unknown', name: 'わからない・相談したい' },
    ],
  },
  {
    id: 'unknown',
    name: 'わからない・相談したい',
    models: [
      { id: 'unknown', name: 'わからない・相談したい' },
    ],
  },
];
