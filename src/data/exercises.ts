import { EquipmentType, Exercise, MuscleGroup, TrackingType } from '../types/workout';

type ExerciseSeedTuple = [
  id: string,
  name: string,
  primaryMuscle: MuscleGroup,
  secondaryMuscles: MuscleGroup[],
  equipment: EquipmentType,
  trackingType?: TrackingType
];

const RAW_EXERCISES: ExerciseSeedTuple[] = [
  // CHEST (14)
  ['ex-bench-barbell', 'Bench Press (Barbell)', 'Chest', ['Triceps', 'Shoulders'], 'Barbell'],
  ['ex-incline-bench-barbell', 'Incline Bench Press (Barbell)', 'Chest', ['Shoulders', 'Triceps'], 'Barbell'],
  ['ex-decline-bench-barbell', 'Decline Bench Press (Barbell)', 'Chest', ['Triceps'], 'Barbell'],
  ['ex-bench-db', 'Bench Press (Dumbbell)', 'Chest', ['Triceps', 'Shoulders'], 'Dumbbell'],
  ['ex-incline-bench-db', 'Incline Bench Press (Dumbbell)', 'Chest', ['Shoulders', 'Triceps'], 'Dumbbell'],
  ['ex-decline-bench-db', 'Decline Bench Press (Dumbbell)', 'Chest', ['Triceps'], 'Dumbbell'],
  ['ex-chest-press-machine', 'Chest Press (Machine)', 'Chest', ['Triceps', 'Shoulders'], 'Machine'],
  ['ex-incline-press-machine', 'Incline Chest Press (Machine)', 'Chest', ['Shoulders', 'Triceps'], 'Machine'],
  ['ex-chest-fly-db', 'Chest Fly (Dumbbell)', 'Chest', ['Shoulders'], 'Dumbbell'],
  ['ex-pec-deck', 'Butterfly (Pec Deck)', 'Chest', [], 'Machine'],
  ['ex-cable-fly', 'Cable Fly Crossovers', 'Chest', ['Shoulders'], 'Cable'],
  ['ex-low-cable-fly', 'Low-to-High Cable Fly', 'Chest', ['Shoulders'], 'Cable'],
  ['ex-chest-dip', 'Chest Dip', 'Chest', ['Triceps', 'Shoulders'], 'Bodyweight', 'bodyweight'],
  ['ex-pushup', 'Push Up', 'Chest', ['Triceps', 'Shoulders', 'Abdominals'], 'Bodyweight', 'bodyweight'],

  // UPPER BACK & LATS (18)
  ['ex-pullup', 'Pull Up', 'Lats', ['Upper Back', 'Biceps'], 'Bodyweight', 'bodyweight'],
  ['ex-pullup-assisted', 'Pull Up (Assisted)', 'Lats', ['Upper Back', 'Biceps'], 'Machine', 'assisted_bodyweight'],
  ['ex-pullup-weighted', 'Pull Up (Weighted)', 'Lats', ['Upper Back', 'Biceps'], 'Other'],
  ['ex-chinup', 'Chin Up', 'Lats', ['Biceps', 'Upper Back'], 'Bodyweight', 'bodyweight'],
  ['ex-lat-pulldown', 'Lat Pulldown (Cable)', 'Lats', ['Biceps', 'Upper Back'], 'Cable'],
  ['ex-close-grip-pulldown', 'Close Grip Lat Pulldown', 'Lats', ['Biceps', 'Upper Back'], 'Cable'],
  ['ex-straight-arm-pulldown', 'Straight Arm Lat Pulldown', 'Lats', ['Abdominals'], 'Cable'],
  ['ex-barbell-row', 'Bent Over Row (Barbell)', 'Upper Back', ['Lats', 'Biceps', 'Lower Back'], 'Barbell'],
  ['ex-pendlay-row', 'Pendlay Row (Barbell)', 'Upper Back', ['Lats', 'Biceps', 'Lower Back'], 'Barbell'],
  ['ex-db-row', 'Single Arm Row (Dumbbell)', 'Lats', ['Upper Back', 'Biceps'], 'Dumbbell'],
  ['ex-chest-supported-row', 'Chest Supported Row (Dumbbell)', 'Upper Back', ['Lats', 'Biceps'], 'Dumbbell'],
  ['ex-seated-cable-row', 'Seated Cable Row', 'Upper Back', ['Lats', 'Biceps'], 'Cable'],
  ['ex-tbar-row', 'T-Bar Row', 'Upper Back', ['Lats', 'Biceps', 'Lower Back'], 'Machine'],
  ['ex-iso-row-machine', 'Iso-Lateral Row (Machine)', 'Upper Back', ['Lats', 'Biceps'], 'Machine'],
  ['ex-face-pull', 'Face Pull', 'Upper Back', ['Shoulders'], 'Cable'],
  ['ex-shrug-barbell', 'Shrug (Barbell)', 'Upper Back', ['Forearms'], 'Barbell'],
  ['ex-shrug-db', 'Shrug (Dumbbell)', 'Upper Back', ['Forearms'], 'Dumbbell'],
  ['ex-band-pull-apart', 'Band Pull Apart', 'Upper Back', ['Shoulders'], 'Band', 'bodyweight'],

  // LOWER BACK (5)
  ['ex-deadlift-barbell', 'Deadlift (Barbell)', 'Lower Back', ['Glutes', 'Hamstrings', 'Upper Back', 'Forearms'], 'Barbell'],
  ['ex-sumo-deadlift', 'Sumo Deadlift (Barbell)', 'Glutes', ['Hamstrings', 'Quads', 'Lower Back'], 'Barbell'],
  ['ex-trap-bar-deadlift', 'Trap Bar Deadlift', 'Quads', ['Glutes', 'Hamstrings', 'Lower Back'], 'Barbell'],
  ['ex-back-extension', 'Back Extension (Hyperextension)', 'Lower Back', ['Glutes', 'Hamstrings'], 'Bodyweight', 'bodyweight'],
  ['ex-good-morning', 'Good Morning (Barbell)', 'Lower Back', ['Hamstrings', 'Glutes'], 'Barbell'],

  // SHOULDERS (15)
  ['ex-ohp-barbell', 'Overhead Press (Barbell)', 'Shoulders', ['Triceps', 'Abdominals'], 'Barbell'],
  ['ex-seated-ohp-barbell', 'Seated Overhead Press (Barbell)', 'Shoulders', ['Triceps'], 'Barbell'],
  ['ex-ohp-db', 'Shoulder Press (Dumbbell)', 'Shoulders', ['Triceps'], 'Dumbbell'],
  ['ex-arnold-press', 'Arnold Press (Dumbbell)', 'Shoulders', ['Triceps'], 'Dumbbell'],
  ['ex-shoulder-press-machine', 'Shoulder Press (Machine)', 'Shoulders', ['Triceps'], 'Machine'],
  ['ex-lateral-raise-db', 'Lateral Raise (Dumbbell)', 'Shoulders', [], 'Dumbbell'],
  ['ex-lateral-raise-cable', 'Lateral Raise (Cable)', 'Shoulders', [], 'Cable'],
  ['ex-lateral-raise-machine', 'Lateral Raise (Machine)', 'Shoulders', [], 'Machine'],
  ['ex-front-raise-db', 'Front Raise (Dumbbell)', 'Shoulders', [], 'Dumbbell'],
  ['ex-rear-delt-fly-db', 'Rear Delt Reverse Fly (Dumbbell)', 'Shoulders', ['Upper Back'], 'Dumbbell'],
  ['ex-rear-delt-machine', 'Rear Delt Reverse Fly (Machine)', 'Shoulders', ['Upper Back'], 'Machine'],
  ['ex-rear-delt-cable', 'Single Arm Cable Rear Delt Fly', 'Shoulders', ['Upper Back'], 'Cable'],
  ['ex-upright-row-barbell', 'Upright Row (Barbell)', 'Shoulders', ['Upper Back', 'Biceps'], 'Barbell'],
  ['ex-upright-row-cable', 'Upright Row (Cable)', 'Shoulders', ['Upper Back'], 'Cable'],
  ['ex-landmine-press', 'Landmine Press', 'Shoulders', ['Chest', 'Triceps'], 'Barbell'],

  // BICEPS (11)
  ['ex-bicep-curl-barbell', 'Bicep Curl (Barbell)', 'Biceps', ['Forearms'], 'Barbell'],
  ['ex-ez-bar-curl', 'EZ Bar Biceps Curl', 'Biceps', ['Forearms'], 'Barbell'],
  ['ex-bicep-curl-db', 'Bicep Curl (Dumbbell)', 'Biceps', ['Forearms'], 'Dumbbell'],
  ['ex-incline-curl-db', 'Incline Seated Curl (Dumbbell)', 'Biceps', ['Forearms'], 'Dumbbell'],
  ['ex-hammer-curl', 'Hammer Curl (Dumbbell)', 'Biceps', ['Forearms'], 'Dumbbell'],
  ['ex-preacher-curl-ez', 'Preacher Curl (Barbell)', 'Biceps', [], 'Barbell'],
  ['ex-preacher-curl-machine', 'Preacher Curl (Machine)', 'Biceps', [], 'Machine'],
  ['ex-concentration-curl', 'Concentration Curl (Dumbbell)', 'Biceps', [], 'Dumbbell'],
  ['ex-cable-curl', 'Bicep Curl (Cable)', 'Biceps', ['Forearms'], 'Cable'],
  ['ex-bayesian-curl', 'Bayesian Cable Curl', 'Biceps', [], 'Cable'],
  ['ex-rope-hammer-curl', 'Rope Hammer Curl (Cable)', 'Biceps', ['Forearms'], 'Cable'],

  // TRICEPS (11)
  ['ex-tricep-pushdown-rope', 'Triceps Rope Pushdown', 'Triceps', [], 'Cable'],
  ['ex-tricep-pushdown-bar', 'Triceps Straight Bar Pushdown', 'Triceps', [], 'Cable'],
  ['ex-overhead-tricep-cable', 'Overhead Triceps Extension (Cable)', 'Triceps', [], 'Cable'],
  ['ex-overhead-tricep-db', 'Overhead Triceps Extension (Dumbbell)', 'Triceps', [], 'Dumbbell'],
  ['ex-skullcrusher-ez', 'Skullcrusher (Barbell)', 'Triceps', [], 'Barbell'],
  ['ex-skullcrusher-db', 'Skullcrusher (Dumbbell)', 'Triceps', [], 'Dumbbell'],
  ['ex-close-grip-bench', 'Close Grip Bench Press (Barbell)', 'Triceps', ['Chest', 'Shoulders'], 'Barbell'],
  ['ex-tricep-dip', 'Triceps Dip', 'Triceps', ['Chest', 'Shoulders'], 'Bodyweight', 'bodyweight'],
  ['ex-dip-assisted', 'Triceps Dip (Assisted)', 'Triceps', ['Chest'], 'Machine', 'assisted_bodyweight'],
  ['ex-tricep-dip-machine', 'Seated Dip (Machine)', 'Triceps', ['Chest'], 'Machine'],
  ['ex-tricep-kickback', 'Triceps Kickback (Dumbbell)', 'Triceps', [], 'Dumbbell'],

  // FOREARMS (4)
  ['ex-wrist-curl-db', 'Wrist Curl (Dumbbell)', 'Forearms', [], 'Dumbbell'],
  ['ex-reverse-curl-barbell', 'Reverse Curl (Barbell)', 'Forearms', ['Biceps'], 'Barbell'],
  ['ex-farmers-walk', 'Farmers Walk', 'Forearms', ['Upper Back', 'Abdominals'], 'Dumbbell'],
  ['ex-dead-hang', 'Dead Hang', 'Forearms', ['Lats'], 'Bodyweight', 'duration'],

  // QUADS (13)
  ['ex-squat-barbell', 'Squat (Barbell)', 'Quads', ['Glutes', 'Hamstrings', 'Lower Back'], 'Barbell'],
  ['ex-front-squat', 'Front Squat (Barbell)', 'Quads', ['Glutes', 'Abdominals'], 'Barbell'],
  ['ex-goblet-squat', 'Goblet Squat (Dumbbell)', 'Quads', ['Glutes', 'Abdominals'], 'Dumbbell'],
  ['ex-hack-squat', 'Hack Squat (Machine)', 'Quads', ['Glutes'], 'Machine'],
  ['ex-leg-press', 'Leg Press (Machine)', 'Quads', ['Glutes', 'Hamstrings'], 'Machine'],
  ['ex-bulgarian-split-squat', 'Bulgarian Split Squat (Dumbbell)', 'Quads', ['Glutes', 'Hamstrings'], 'Dumbbell'],
  ['ex-walking-lunge', 'Walking Lunge (Dumbbell)', 'Quads', ['Glutes', 'Hamstrings'], 'Dumbbell'],
  ['ex-reverse-lunge', 'Reverse Lunge (Barbell)', 'Quads', ['Glutes', 'Hamstrings'], 'Barbell'],
  ['ex-leg-extension', 'Leg Extension (Machine)', 'Quads', [], 'Machine'],
  ['ex-pendulum-squat', 'Pendulum Squat (Machine)', 'Quads', ['Glutes'], 'Machine'],
  ['ex-step-up', 'Step Up (Dumbbell)', 'Quads', ['Glutes'], 'Dumbbell'],
  ['ex-sissy-squat', 'Sissy Squat', 'Quads', [], 'Bodyweight', 'bodyweight'],
  ['ex-wall-sit', 'Wall Sit', 'Quads', ['Glutes'], 'Bodyweight', 'duration'],

  // HAMSTRINGS (7)
  ['ex-rdl-barbell', 'Romanian Deadlift (Barbell)', 'Hamstrings', ['Glutes', 'Lower Back'], 'Barbell'],
  ['ex-rdl-db', 'Romanian Deadlift (Dumbbell)', 'Hamstrings', ['Glutes', 'Lower Back'], 'Dumbbell'],
  ['ex-stiff-leg-dl', 'Stiff-Legged Deadlift (Barbell)', 'Hamstrings', ['Glutes', 'Lower Back'], 'Barbell'],
  ['ex-lying-leg-curl', 'Lying Leg Curl (Machine)', 'Hamstrings', [], 'Machine'],
  ['ex-seated-leg-curl', 'Seated Leg Curl (Machine)', 'Hamstrings', [], 'Machine'],
  ['ex-nordic-curl', 'Nordic Hamstring Curl', 'Hamstrings', ['Glutes'], 'Bodyweight', 'bodyweight'],
  ['ex-kb-swing', 'Kettlebell Swing', 'Hamstrings', ['Glutes', 'Lower Back', 'Full Body'], 'Kettlebell'],

  // GLUTES (7)
  ['ex-hip-thrust-barbell', 'Hip Thrust (Barbell)', 'Glutes', ['Hamstrings'], 'Barbell'],
  ['ex-hip-thrust-machine', 'Hip Thrust (Machine)', 'Glutes', ['Hamstrings'], 'Machine'],
  ['ex-glute-bridge', 'Glute Bridge', 'Glutes', ['Hamstrings'], 'Bodyweight', 'bodyweight'],
  ['ex-cable-kickback', 'Glute Kickback (Cable)', 'Glutes', ['Hamstrings'], 'Cable'],
  ['ex-hip-abduction', 'Hip Abduction (Machine)', 'Glutes', [], 'Machine'],
  ['ex-hip-adduction', 'Hip Adduction (Machine)', 'Glutes', ['Quads'], 'Machine'],
  ['ex-cable-pull-through', 'Cable Pull Through', 'Glutes', ['Hamstrings', 'Lower Back'], 'Cable'],

  // CALVES (4)
  ['ex-standing-calf-raise', 'Standing Calf Raise (Machine)', 'Calves', [], 'Machine'],
  ['ex-seated-calf-raise', 'Seated Calf Raise (Machine)', 'Calves', [], 'Machine'],
  ['ex-calf-press-leg-press', 'Calf Press on Leg Press', 'Calves', [], 'Machine'],
  ['ex-single-leg-calf-db', 'Single Leg Calf Raise (Dumbbell)', 'Calves', [], 'Dumbbell'],

  // ABDOMINALS (9)
  ['ex-cable-crunch', 'Cable Crunch', 'Abdominals', [], 'Cable'],
  ['ex-hanging-leg-raise', 'Hanging Leg Raise', 'Abdominals', ['Forearms'], 'Bodyweight', 'bodyweight'],
  ['ex-ab-wheel', 'Ab Wheel Rollout', 'Abdominals', ['Lats', 'Shoulders'], 'Other', 'bodyweight'],
  ['ex-plank', 'Plank', 'Abdominals', ['Shoulders'], 'Bodyweight', 'duration'],
  ['ex-side-plank', 'Side Plank', 'Abdominals', [], 'Bodyweight', 'duration'],
  ['ex-russian-twist', 'Russian Twist', 'Abdominals', [], 'Other'],
  ['ex-decl-crunch', 'Decline Crunch', 'Abdominals', [], 'Bodyweight', 'bodyweight'],
  ['ex-pallof-press', 'Pallof Press (Cable)', 'Abdominals', [], 'Cable'],
  ['ex-machine-crunch', 'Ab Crunch (Machine)', 'Abdominals', [], 'Machine'],

  // FULL BODY & KETTLEBELL (5)
  ['ex-clean-and-press', 'Clean and Press (Barbell)', 'Full Body', ['Shoulders', 'Quads', 'Upper Back'], 'Barbell'],
  ['ex-power-clean', 'Power Clean (Barbell)', 'Full Body', ['Hamstrings', 'Upper Back', 'Quads'], 'Barbell'],
  ['ex-turkish-getup', 'Turkish Get-Up (Kettlebell)', 'Full Body', ['Shoulders', 'Abdominals'], 'Kettlebell'],
  ['ex-thruster', 'Thruster (Barbell)', 'Full Body', ['Quads', 'Shoulders', 'Triceps'], 'Barbell'],
  ['ex-burpee', 'Burpee', 'Full Body', ['Cardio', 'Chest', 'Quads'], 'Bodyweight', 'bodyweight'],

  // CARDIO (6)
  ['ex-treadmill-run', 'Running (Treadmill)', 'Cardio', ['Quads', 'Calves'], 'Machine', 'distance'],
  ['ex-outdoor-run', 'Running (Outdoor)', 'Cardio', ['Quads', 'Calves'], 'Other', 'distance'],
  ['ex-stationary-bike', 'Cycling (Stationary Bike)', 'Cardio', ['Quads', 'Hamstrings'], 'Machine', 'distance'],
  ['ex-rowing-machine', 'Rowing Machine', 'Cardio', ['Upper Back', 'Quads'], 'Machine', 'distance'],
  ['ex-stair-climber', 'Stair Climber', 'Cardio', ['Glutes', 'Quads', 'Calves'], 'Machine', 'duration'],
  ['ex-jump-rope', 'Jump Rope', 'Cardio', ['Calves'], 'Other', 'duration'],
];

export const BUILT_IN_EXERCISES: Exercise[] = RAW_EXERCISES.map(
  ([id, name, primaryMuscle, secondaryMuscles, equipment, trackingType]) => ({
    id,
    name,
    primaryMuscle,
    secondaryMuscles,
    equipment,
    trackingType: trackingType ?? 'weight_reps',
    isCustom: false,
  })
);
