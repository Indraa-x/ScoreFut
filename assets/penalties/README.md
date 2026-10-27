# Penalty character images

Created for ScoreFut with the built-in ImageGen tool on 2026-10-27. These are fictional adult athletes with a photographic appearance, not photographs of real identified players. The user approved a generic photographic athlete. All four files retain their original transparent PNG alpha channel; left goalkeeper dives are mirrored by CSS.

- `shooter-ready.png`: footballer waiting to take the kick.
- `shooter-kick.png`: matching footballer striking the ball.
- `keeper-ready.png`: goalkeeper in a ready stance.
- `keeper-dive.png`: matching goalkeeper diving to the viewer's right.
- `stadium.png`: unmodified stadium background supplied by the user ("Gol Sob as Luzes do Estádio.png"). The stage preserves its aspect ratio so the players and ball stay aligned with the photographed goal.

The two goalkeeper poses use the same source-pixel scale: the dive image is 1774×887, compared with the standing image at 1024×1536. Its rendered width and height therefore use those ratios rather than stretching the horizontal pose to the standing pose's height.

## Final prompts

### Shooter, ready

Use case: photorealistic-natural. Asset type: transparent full-body photo cutout for an interactive football penalty game. Generate one generic adult male professional footballer, athletic build, dark short hair, wearing a plain emerald-green jersey with a small white number 9 on the back, dark navy shorts, long white socks and orange football boots, NO logos. Camera sees him from behind, slightly to his left, looking toward a goal that is NOT included. He is standing poised before taking a penalty, body upright and relaxed, legs slightly apart, full body from head to both complete boots. Natural sports photography, realistic skin, fabric, anatomy, stadium floodlighting from upper left, sharp clean edges. Isolated on genuinely transparent background, no pitch, no goal, no other people, no text or watermark. No ball; ball will be composited separately in the game. Character upright centered, occupies 88 percent of height, generous clear margin around the complete silhouette. This will have a matching kicking pose later: retain a simple clear recognizable uniform.

### Shooter, kicking (reference: ready pose)

Use case: identity-preserve sports photograph. Create the matching KICKING POSE asset of the SAME generic adult footballer in the reference. Preserve the exact plain emerald-green number 9 jersey, navy shorts, long white socks, orange boots, body build, short dark hair, lighting and photographic realism. Change the pose to the instant of striking a penalty with his right foot: viewed from behind with a slight 3/4 rear angle; left leg planted, right leg extending forward and slightly right through an imaginary ball, arms naturally spread for balance, torso leaning slightly left. Show the complete full body including every boot, no cropping. Isolate the athlete with clean accurate cutout edges and an actually fully transparent background. Remove all background haze and halos. No pitch, goal, ground, text, logos, watermarks or ball. The ball is animated separately by the website. Center the full body with room around the outstretched arms and kicking leg. Photorealistic sports photography, not illustration.

### Goalkeeper, ready

Use case: photorealistic-natural. Asset type: transparent full-body goalkeeper photo cutout for a football penalty game. One generic adult male professional goalkeeper, athletic build, short dark hair, amber orange long-sleeved goalkeeper jersey with NO logos or writing, black shorts, amber socks, black boots, white goalkeeper gloves. Front view facing the viewer, ready stance in goal, knees slightly bent, arms out and down ready to dive, hands clearly visible. Full complete body from head to both boots, centered, occupies 88 percent of height, generous transparent margins. Realistic professional sports photography, natural anatomy, realistic fabric and face, soft stadium floodlight from upper left. Genuinely transparent background. No goal, field, crowd, text, watermark or ball. Not a cartoon, not a CGI character. Later a matching image will show this same goalkeeper diving.

### Goalkeeper, diving (reference: ready pose)

Use case: identity-preserve sports photograph. Create a matching ACTION cutout of exactly the SAME generic adult goalkeeper in the reference image. Preserve identity, facial features, short hair, amber-orange plain jersey, black shorts, orange socks, black boots and white gloves. Change pose to a dramatic realistic goalkeeper dive toward the VIEWER'S RIGHT at mid height: full body almost horizontal, both arms and gloved hands stretching right to save a penalty, feet trailing to the left, face and torso seen from the front. Show the entire full body and both gloves and boots, wide landscape composition, no cropping. Photograph with natural anatomy, sharp sports photography, lighting matching reference. Isolate with actual transparent background, clean cutout edges. NO background glow, NO black backdrop, NO haze, NO grass, NO goal, NO ball, NO captions or logos. The image will be composited on a game pitch, and mirrored for left-hand saves.
