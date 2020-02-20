/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Actor,
	AnimationEaseCurves,
	AnimationKeyframe,
	AnimationWrapMode,
	AssetContainer,
	ButtonBehavior,
	Context,
	Quaternion,
	TextAnchorLocation,
    Vector3,
    Material,
    Color3,
    AlphaMode,
    Color4,
    Mesh,
	ColliderType,
	CollisionDetectionMode,
	Animation
} from '@microsoft/mixed-reality-extension-sdk';
import { int, float } from '@microsoft/mixed-reality-extension-sdk/built/math/types';
import { CipherNameAndProtocol } from 'tls';

////DONE FOR PICROSS:
//1: Interactable Cube
/// ? Create Template cube - DONE
//TODO: Animations, not getting the right rotations :(
/// - Click to animate and change color - "Fill In" - DONE
/// - Click to animate and change to wireframe - "Rule Out" - DONE
/// - Modality choice (different buttons?) - DONE

//2: Group of Cubes:
/// - Line
/// - Array

//2.5: Menu Flow
// Front end "Start" cube
// Front end Instructions cube (TODO: Instructions Script)
// Front end Tutorial cube (TODO: Tutorial script)

//3: Victory Condition:
/// - Blackout (All filled) (DONE)
/// - Pattern (Match internal pattern of yes/No, prereq for labels)

//4: Labels:
/// - Floating labels next to cube array
/// - Allow crossing out with interaction
/// Tutorial set

//Todo for Picross:

//4: Labels:

/// - Auto cross out on filling the row correctly (Pushed)

//4.5 Sets of puzzles, scripting? (On start, on end, maybe more plug and play animations for cube states?) 

/// Random fast-paced 5x5 sets

//5: Wow factor
//// - Rigid Body on victory (DONE)
/// - Sounds
/// - Animations?

class PicrossPuzzle {
	public width = 0;
	public height = 0;
	public answerKey: int[][] = new Array<int[]>();
	public creator = "Me";
	public name = "Name";
	public hint = "Hint";
}

class PicrossPuzzleSet {
	public puzzles: PicrossPuzzle[] = new Array<PicrossPuzzle>();
}

enum BlockState {
	Filled,
	Empty,
	RuledOut,
}

class GameBoardPiece
{
	public actor: Actor = null;
	public currentState: BlockState = BlockState.Filled;
	public fillin : Animation;
	public erase: Animation;
	public ruleout: Animation;
	//Desired state?	
}

class Hint
{
	public BoxActor: Actor = null;
	public TextActor: Actor = null;
	public number: int = 0;
	public crossedOut = false;
	public uncrossedMaterialId = "";
	public crossedMaterialId = "";

	public ToggleCrossState()
	{
		if(this.crossedOut)
		{
			this.SetUncrossed();
		}
		else
		{
			this.SetCrossed();

		}
	}

	public SetCrossed()
	{
		this.BoxActor.appearance.materialId = this.crossedMaterialId;

		this.crossedOut = true;
	}

	public SetUncrossed()
	{
		this.BoxActor.appearance.materialId = this.uncrossedMaterialId;

		this.crossedOut = false;
	}
	
}

class HintSet
{
	public hints: Hint[] = new Array<Hint>();
	public isHorizontal = true;
	public solved = false;
}

export default class PicrossApp {

	//Constructor
	constructor(private context: Context, private baseUrl: string) {
		this.CubeAssets = new AssetContainer(context);
		this.context.onStarted(() => this.started());
	}

	//Private Memers
//#region  Member Vars
	//Actor Registry, for easy cleanup
	private SceneActors: Actor[] = null;
	private SceneEffects: Actor[] = null;

	//ASSETS
	//Asset Containers
	private CubeAssets: AssetContainer = null;
	
	//Materials
    private WhiteSolidMaterial: Material = null;
    private BlackSolidMaterial: Material = null;
    private GreyTransparentMaterial: Material = null;
	private TransparentMaterial: Material = null;
	//Meshes
	private CubeMesh: Mesh = null;

	//Front-End Members
	private StartCube: Actor = null;
	private StartText: Actor = null;
	private EditCube: Actor = null;
	private EditText: Actor = null;
	private TutorialCube: Actor = null;
	private TutorialText: Actor = null;

	private Banner: Actor = null;

	//In-Game UI
	private InputControlCube: GameBoardPiece = null;
	private InputControlCubeText: Actor = null;
	private MainMenuCube: Actor = null;
	private MainMenuText: Actor = null;

	//Edit UI
	private SaveCube: Actor = null;
	private SaveText: Actor = null;

	//Victory UI
	private VictoryText: Actor = null;

	private CurrentPuzzleSet: PicrossPuzzleSet = null;
	private PuzzleIndex = 0;

	//Template for victory
	private VictoryCondition: int[][] = null;

	// 2d Array of Game board Pieces
	private GameBoard: GameBoardPiece[][] = null;
	private HorizontalHints: HintSet[] = null;
	private VerticalHints: HintSet[] = null;

	private CurrentWidth: int = 5;
	private CurrentHeight: int = 5;
	
	private CurrentInputState: BlockState = BlockState.Filled;

	private EditMode = false;
//#endregion

//#region Codes
	//Front-end Control code
	private CreateMainMenu()
	{
		this.DestroyScene();

		this.StartCube = Actor.Create(this.context, {
            actor: {
				collider: {geometry: {shape: ColliderType.Box}},
                transform: {
                    local: { position:{ x:-2, y: -.5, z: 0}, scale:{ x: .2, y: .2, z: .2}}
				},
                name: 'StartCube',
                appearance: {
					meshId: this.CubeMesh.id,
					materialId: this.WhiteSolidMaterial.id
				}
            }
		});

		this.SceneActors.push(this.StartCube);

		const startButtonControlBehavior = this.StartCube.setBehavior(ButtonBehavior);
		startButtonControlBehavior.onClick(_ => {
			this.DefaultVictoryCondition();
			this.StartGame();
		});

		this.StartText = Actor.Create(this.context, {
			actor: {
				name: 'StartText',
				parentId: this.StartCube.id,
				transform: {
					local: { position: { x: 0, y: 1.5, z: 0 } }
				},
				text: {
					contents: "Start Game!",
					anchor: TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 1
				}
			}
		});

		this.SceneActors.push(this.StartText);

		this.EditCube = Actor.Create(this.context, {
            actor: {
				collider: {geometry: {shape: ColliderType.Box}},
                transform: {
                    local: { position:{ x:-0, y: -.5, z: 0}, scale:{ x: .2, y: .2, z: .2}}
				},
                name: 'HelpCube',
                appearance: {
					meshId: this.CubeMesh.id,
					materialId: this.WhiteSolidMaterial.id
				}
            }
		});
		
		const helpCubeButt = this.EditCube.setBehavior(ButtonBehavior);
		helpCubeButt.onClick(_ => {
			this.EditGame();
		});
		this.SceneActors.push(this.EditCube);

		this.EditText = Actor.Create(this.context, {
			actor: {
				name: 'EditCube',
				parentId: this.EditCube.id,
				transform: {
					local: { position: { x: 0, y: 1.5, z: 0 } }
				},
				text: {
					contents: "Edit Game Board!",
					anchor: TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 1
				}
			}
		});

		this.SceneActors.push(this.EditText);

		this.TutorialCube = Actor.Create(this.context, {
            actor: {
				collider: {geometry: {shape: ColliderType.Box}},
                transform: {
                    local: { position:{ x:2, y: -.5, z: 0}, scale:{ x: .2, y: .2, z: .2}}
				},
                name: 'TutorialCube',
                appearance: {
					meshId: this.CubeMesh.id,
					materialId: this.WhiteSolidMaterial.id
				}
            }
		});

		const tutCubeButt = this.TutorialCube.setBehavior(ButtonBehavior);
		tutCubeButt.onClick(_ => {
			this.SetupTutorialPicrossSet();
			this.PuzzleIndex = 0;
			this.ResetVictoryCondition();
			this.StartGame();
		});

		this.SceneActors.push(this.TutorialCube);

		this.TutorialText = Actor.Create(this.context, {
			actor: {
				name: 'TutorialText',
				parentId: this.TutorialCube.id,
				transform: {
					local: { position: { x: 0, y: 1.5, z: 0 } }
				},
				text: {
					contents: "Play Tutorial!",
					anchor: TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 1
				}
			}
		});

		this.SceneActors.push(this.TutorialText);

		this.Banner = Actor.Create(this.context, {
			actor: {
				name: 'BannerText',
				transform: {
					local: { position: { x: 0, y: 2, z: 0 } }
				},
				text: {
					contents: "AltspacePicross!!",
					anchor: TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 1.3
				}
			}
		});

		this.SceneActors.push(this.Banner);
	}

	private DestroyScene()
	{
		this.SceneActors.forEach(element => {
			element.destroy();
		});

		this.SceneActors = new Array<Actor>();

		this.SceneEffects.forEach(element => {
			element.destroy();
		});
		this.SceneEffects = new Array<Actor>();
	}



	//Methods
    private started() {

		this.SceneActors = new Array<Actor>();
		this.SceneEffects = new Array<Actor>();
		

        this.BlackSolidMaterial = this.CubeAssets.createMaterial("BlackMaterial", {
            color: Color3.Black(), alphaMode: AlphaMode.Opaque, 
        });
        this.WhiteSolidMaterial = this.CubeAssets.createMaterial("WhiteMaterial", {
            color: Color3.White(), alphaMode: AlphaMode.Opaque
        });
        this.GreyTransparentMaterial = this.CubeAssets.createMaterial("GreyMaterial", {
            color: Color4.FromColor3(Color3.Gray(), .4), alphaMode: AlphaMode.Blend
		});
		this.TransparentMaterial = this.CubeAssets.createMaterial("TransparentMaterial", {
            color: Color4.FromColor3(Color3.White(), 0), alphaMode: AlphaMode.Blend
        });

        this.CubeMesh = this.CubeAssets.createBoxMesh("BoxMesh", 1, 1, 1);

		this.DefaultVictoryCondition();

		this.CreateMainMenu();
		//this.CreateGameBoard();
	}

	private SetupStarterPicrossSet()
	{
		this.CurrentPuzzleSet = new PicrossPuzzleSet();
		let newPuzzle: PicrossPuzzle = new PicrossPuzzle();
		newPuzzle.height = 5;
		newPuzzle.width = 5;
		newPuzzle.answerKey =	[ [ 1, 1, 1, 1, 1 ]
								, [ 1, 0, 0, 0, 1 ]
								, [ 1, 0, 1, 0, 1 ]
								, [ 1, 0, 0, 0, 1 ]
								, [ 1, 1, 1, 1, 1 ]];
		this.CurrentPuzzleSet.puzzles = [newPuzzle];
	}

	private SetupTutorialPicrossSet()
	{
		this.CurrentPuzzleSet = new PicrossPuzzleSet();
		let newPuzzle0: PicrossPuzzle = new PicrossPuzzle();
		newPuzzle0.height = 1;
		newPuzzle0.width = 1;
		newPuzzle0.answerKey =	[[ 1 ]];

		this.CurrentPuzzleSet = new PicrossPuzzleSet();
		let newPuzzle1: PicrossPuzzle = new PicrossPuzzle();
		newPuzzle1.height = 1;
		newPuzzle1.width = 3;
		newPuzzle1.answerKey =	[[0, 1, 0]];

		this.CurrentPuzzleSet = new PicrossPuzzleSet();
		let newPuzzle2: PicrossPuzzle = new PicrossPuzzle();
		newPuzzle2.height = 3;
		newPuzzle2.width = 3;
		newPuzzle2.answerKey = [[1, 1, 1],
								[0, 1, 1],
								[0, 0, 1]];

		this.CurrentPuzzleSet.puzzles = [newPuzzle0, newPuzzle1, newPuzzle2];
	}

	private SetupChallenge()
	{

	}

	private ResetVictoryCondition()
	{
		this.VictoryCondition = this.CurrentPuzzleSet.puzzles[this.PuzzleIndex].answerKey;
		this.CurrentWidth = this.CurrentPuzzleSet.puzzles[this.PuzzleIndex].width;
		this.CurrentHeight = this.CurrentPuzzleSet.puzzles[this.PuzzleIndex].height;
	}

	private DefaultVictoryCondition()
	{
		this.SetupStarterPicrossSet();
		this.PuzzleIndex = 0;
		this.ResetVictoryCondition();
	}

	private EditGame()
	{
		this.EditMode = true;
		this.SetupEditUI();
		this.UpdateBoardFromVictory();
	}

	private StartGame()
	{
		this.EditMode = false;
		this.SetupMainGameUI();
	}

	private CreateSaveCube()
	{
		this.SaveCube = Actor.Create(this.context, {
            actor: {
				collider: {geometry: {shape: ColliderType.Box}},
                transform: {
                    local: { position:{ x: 0, y: -.5, z: 0 }, scale:{ x: .1, y: .1, z: .1}}
				},
                name: 'SaveCube',
                appearance: {
					meshId: this.CubeMesh.id,
					materialId: this.WhiteSolidMaterial.id
				}
            }
		});

		this.SceneActors.push(this.SaveCube);
		
		this.SaveText = Actor.Create(this.context, {
			actor: {
				name: 'SaveText',
				parentId: this.SaveCube.id,
				transform: {
					local: { position: { x: 0, y: 1, z: 0 } }
				},
				text: {
					contents: "Save Puzzle!",
					anchor: TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 1
				}
			}
		});

		this.SceneActors.push(this.SaveText);

				// Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
		// Button behaviors have two pairs of events: hover start/stop, and click start/stop.
		const inputControlBehavior = this.SaveCube.setBehavior(ButtonBehavior);
		inputControlBehavior.onClick(_ => {
			this.UpdateVictoryFromBoard();
		});		
	}

	private UpdateVictoryFromBoard()
	{
		this.ResetVictoryCondition();
		for (let y = 0; y < this.GameBoard.length; y++) {
			for (let x = 0; x < this.GameBoard[y].length; x++) {
				const cube = this.GameBoard[y][x];
				this.VictoryCondition[y][x] = (cube.currentState === BlockState.Filled) ? 1 : 0;
			}
		}
	}

	private UpdateBoardFromVictory()
	{
		for (let y = 0; y < this.VictoryCondition.length; y++) {
			for (let x = 0; x < this.VictoryCondition[y].length; x++) {
				const gamePiece = this.GameBoard[y][x];
				gamePiece.currentState = (this.VictoryCondition[y][x] === 1) ? BlockState.Filled : BlockState.Empty;
				this.SetCubeState(gamePiece, gamePiece.currentState);
			}
		}
	}

	private CreateInGameInputControl()
	{
		this.InputControlCube = new GameBoardPiece();
		this.InputControlCube.actor = Actor.Create(this.context, {
            actor: {
				collider: {geometry: {shape: ColliderType.Box}},
                transform: {
                    local: { position:{ x: -1, y: -.5, z: 0 }, scale:{ x: .1, y: .1, z: .1}}
				},
                name: 'InputControlCube',
                appearance: {
					meshId: this.CubeMesh.id,
					materialId: this.WhiteSolidMaterial.id
				}
            }
		});

		this.InputControlCube.actor.createAnimation(
			// The name is a unique identifier for this animation. We'll pass it to "startAnimation" later.
			"FillIn", {
				keyframes: [{
					time: 0,
					value: { transform: { local: { rotation: Quaternion.Identity()}}}
				}],
				wrapMode: AnimationWrapMode.Once
			}).then(anim => {this.InputControlCube.fillin = anim;});

			this.InputControlCube.actor.createAnimation(
			// The name is a unique identifier for this animation. We'll pass it to "startAnimation" later.
			"Erase", {
				keyframes: [{
					time: 0,
					value: { transform: { local: { rotation: Quaternion.Identity()}}}
				}],
				wrapMode: AnimationWrapMode.Once
			}).then(anim => {this.InputControlCube.erase = anim;});

			this.InputControlCube.actor.createAnimation(
			// The name is a unique identifier for this animation. We'll pass it to "startAnimation" later.
			"RuleOut", {
				keyframes: [{
					time: 0,
					value: { transform: { local: { rotation: Quaternion.Identity()}}}
				}],
				wrapMode: AnimationWrapMode.Once,
			}).then(anim => {this.InputControlCube.ruleout = anim;});

		this.SceneActors.push(this.InputControlCube.actor);
		
		this.InputControlCubeText = Actor.Create(this.context, {
			actor: {
				name: 'Text',
				parentId: this.InputControlCube.actor.id,
				transform: {
					local: { position: { x: 0, y: 1, z: 0 } }
				},
				text: {
					contents: "UNSET!",
					anchor: TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 1
				}
			}
		});

		this.SceneActors.push(this.InputControlCubeText);

				// Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
		// Button behaviors have two pairs of events: hover start/stop, and click start/stop.
		const inputControlBehavior = this.InputControlCube.actor.setBehavior(ButtonBehavior);
		inputControlBehavior.onClick(_ => {
			switch(this.CurrentInputState)
			{
				case BlockState.Filled:
					//Switch To Reset
					this.CurrentInputState = BlockState.Empty;
					break;
				case BlockState.Empty:
					//Swithc To Rule-Out
					this.CurrentInputState = BlockState.RuledOut;
					break;
				case BlockState.RuledOut:
					//Switch to FillIn
					this.CurrentInputState = BlockState.Filled;
					break;
			}

			this.SetCubeState(this.InputControlCube, this.CurrentInputState);
			this.UpdateControlText();
		});
	}

	private CreateMainMenuControl()
	{
		this.MainMenuCube = Actor.Create(this.context, {
            actor: {
				collider: {geometry: {shape: ColliderType.Box}},
                transform: {
                    local: { position:{ x: -1, y: -1, z: 0 }, scale:{ x: .1, y: .1, z: .1}}
				},
                name: 'MainMenuCube',
                appearance: {
					meshId: this.CubeMesh.id,
					materialId: this.BlackSolidMaterial.id
				}
            }
		});

		this.SceneActors.push(this.MainMenuCube);

		const MainMenuControlBehavior  = this.MainMenuCube.setBehavior(ButtonBehavior);
		MainMenuControlBehavior.onClick(_ => {
			this.CreateMainMenu();
		});
		this.MainMenuText = Actor.Create(this.context, {
			actor: {
				name: 'MainMenuText',
				parentId: this.MainMenuCube.id,
				transform: {
					local: { position: { x: 0, y: 1, z: 0 } }
				},
				text: {
					contents: "Return To Main Menu",
					anchor: TextAnchorLocation.BottomCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: .5
				}
			}
		});
	}

	private DestroyHints()
	{
		this.HorizontalHints.forEach(hintset => {
			hintset.hints.forEach(hint => {
				hint.BoxActor.destroy();
				hint.TextActor.destroy();
			});
		});

		this.VerticalHints.forEach(hintset => {
			hintset.hints.forEach(hint => {
				hint.BoxActor.destroy();
				hint.TextActor.destroy();
			});
		});
	}

	private DestroyGameBoard()
	{
		this.GameBoard.forEach(array => {
			array.forEach(element => {
				element.actor.destroy();
			});
		});
	}

	private CreateGameBoard()
	{

		this.GameBoard = new Array(this.CurrentHeight);

		for(let i = 0; i < this.CurrentHeight; ++i)
		{
			this.GameBoard[i] = new Array(this.CurrentWidth);
			for(let j = 0; j < this.CurrentWidth; ++j)
			{
				let cube: GameBoardPiece = new GameBoardPiece();
				cube.actor = Actor.Create(this.context, {
					actor: {
						collider: {geometry: {shape: ColliderType.Box}},
						transform: {
							local: { position:{ x: j *.15, y: 0 + i * .15, z: 0 }, scale:{ x: .1, y: .1, z: .1}}
						},
						name: 'GameBoardPiece',
						appearance: {
							meshId: this.CubeMesh.id,
							materialId: this.WhiteSolidMaterial.id
						}
					}
				});

				cube.actor.createAnimation(
					// The name is a unique identifier for this animation. We'll pass it to "startAnimation" later.
					"FillIn", {
						keyframes: this.generateSpinFrames(.2, Vector3.Up()),
						wrapMode: AnimationWrapMode.Once
					}).then(anim => {cube.fillin = anim;});

				cube.actor.createAnimation(
					// The name is a unique identifier for this animation. We'll pass it to "startAnimation" later.
					"Erase", {
						keyframes: this.generateSpinFrames(.2, Vector3.Down()),
						wrapMode: AnimationWrapMode.Once
					}).then(anim => {cube.erase = anim;});

				cube.actor.createAnimation(
					// The name is a unique identifier for this animation. We'll pass it to "startAnimation" later.
					"RuleOut", {
						keyframes: this.generateSpinFrames(.2, Vector3.Right()),
						wrapMode: AnimationWrapMode.Once,
					}).then(anim => {cube.ruleout = anim;});

				const gameBoardBehavior = cube.actor.setBehavior(ButtonBehavior);

				gameBoardBehavior.onClick(_  => {
					if(cube.currentState !== this.CurrentInputState)
					{
						cube.currentState = this.CurrentInputState;
						this.SetCubeState(cube, cube.currentState);
					}
					
					this.CheckVictoryPattern();
				});

				cube.currentState = BlockState.Empty;

				//TODO: How to get current input state? (Controller buttons pressed?)
				// gameBoardBehavior.onHover('enter', _  => {
				// 	t
				// 	if(cube.currentState != this.CurrentInputState)
				// 	{
				// 		cube.currentState = this.CurrentInputState;
				// 		this.SetCubeState(cube.actor, cube.currentState);
				// 	}
				// });

				this.GameBoard[i][j] = cube;
			}
		}
	}

	private CreateEditInputControl()
	{
		this.InputControlCube.actor = Actor.Create(this.context, {
            actor: {
				collider: {geometry: {shape: ColliderType.Box}},
                transform: {
                    local: { position:{ x: -1, y: -.5, z: 0 }, scale:{ x: .1, y: .1, z: .1}}
				},
                name: 'InputControlCube',
                appearance: {
					meshId: this.CubeMesh.id,
					materialId: this.WhiteSolidMaterial.id
				}
            }
		});

		this.SceneActors.push(this.InputControlCube.actor);
		
		this.InputControlCubeText = Actor.Create(this.context, {
			actor: {
				name: 'Text',
				parentId: this.InputControlCube.actor.id,
				transform: {
					local: { position: { x: 0, y: 1, z: 0 } }
				},
				text: {
					contents: "UNSET!",
					anchor: TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 1
				}
			}
		});

		this.SceneActors.push(this.InputControlCubeText);

				// Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
		// Button behaviors have two pairs of events: hover start/stop, and click start/stop.
		const inputControlBehavior = this.InputControlCube.actor.setBehavior(ButtonBehavior);
		inputControlBehavior.onClick(_ => {
			switch(this.CurrentInputState)
			{
				case BlockState.Filled:
					//Switch To Reset
					this.CurrentInputState = BlockState.Empty;
					break;
				case BlockState.Empty:
					//Switch to FillIn
					this.CurrentInputState = BlockState.Filled;
					break;
			}

			this.SetCubeState(this.InputControlCube, this.CurrentInputState);
			this.UpdateControlText();
		});
	}

	private SetupEditUI()
	{
		this.DestroyScene();

		this.CreateInGameInputControl();
		this.CreateMainMenuControl();
		this.CreateGameBoard();
		this.CreateSaveCube();

		this.SetCubeState(this.InputControlCube, BlockState.Filled);
		this.UpdateControlText();
	}


	
	private SetupMainGameUI()
	{
		this.DestroyScene();

		this.CreateInGameInputControl();
		this.CreateMainMenuControl();
		this.CreateGameBoard();

		this.SetCubeState(this.InputControlCube, BlockState.Filled);
		this.UpdateControlText();

		this.CreateHints();
	}
	
	private CreateHint(number: int, position: Vector3, set: HintSet, isHorizontal: boolean)
	{
		//New Hint
		let newHint: Actor = Actor.Create(this.context,{
			actor: {
				transform: {
					local: { position: position , scale:{ x: .1, y: .1, z: .1} }
				},
				text: {
					contents: number.toString(),
					anchor: TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 1
				}
			}
		});

		let newHintBox: Actor = Actor.Create(this.context, {
			actor: {
				transform: {
					local: { position: position , scale:{ x: .1, y: .1, z: .1} }
				},
				collider:{
					geometry:{
						shape: ColliderType.Box
					}
				},
			appearance: { 
				meshId: this.CubeMesh.id,
				materialId: this.TransparentMaterial.id,
			}}});



		let hintObj: Hint = new Hint();
		hintObj.TextActor = newHint;
		hintObj.BoxActor = newHintBox
		hintObj.crossedMaterialId = this.GreyTransparentMaterial.id;
		hintObj.uncrossedMaterialId = this.TransparentMaterial.id;
		hintObj.number = number;
		hintObj.SetUncrossed();
		
		set.hints.push(hintObj);

		const hintcontrol = newHintBox.setBehavior(ButtonBehavior);
		hintcontrol.onClick(user => {
			if(!set.solved)
				hintObj.ToggleCrossState();
		});			
	}

	private CreateHints()
	{
		//Horizontal Hints
		this.HorizontalHints = new Array<HintSet>();

		for (let y = 0; y < this.CurrentHeight; y++) {
			const hints: HintSet = new HintSet();
			this.HorizontalHints.push(hints);
			hints.isHorizontal = true;
			
			let currentGroupID = 1;
			let currentGroupCount = 0;
			let numGroups = 0;

			//Search right to left and add coresponding hints
			for (let x = this.CurrentWidth - 1; x >= 0; x--) {
				const element = this.VictoryCondition[y][x];
				if(element === currentGroupID)
				{
					++currentGroupCount;
				}
				else
				{
					if(currentGroupCount > 0)
					{
						let v = new Vector3(-.1 -.15 * numGroups , y * .15, 0);
						this.CreateHint(currentGroupCount, v, hints, true );

						currentGroupCount = 0;
						numGroups++;
					}
				}
			}

			if(numGroups === 0 || currentGroupCount > 0)
			{
				let v = new Vector3(-.1 -.15 * numGroups , y * .15, 0);
				this.CreateHint(currentGroupCount, v, hints, true );
			}


		}

		//Vertical Hints
		this.VerticalHints = new Array<HintSet>();

		for (let x = 0; x < this.CurrentWidth; x++) {
			const hints: HintSet = new HintSet();
			this.VerticalHints.push(hints);
			hints.isHorizontal = false;
			
			let currentGroupID = 1;
			let currentGroupCount = 0;
			let numGroups = 0;

			//Search right to left and add coresponding hints
			for (let y = this.CurrentHeight - 1; y >= 0; y--) {
				const element = this.VictoryCondition[y][x];
				if(element === currentGroupID)
				{
					++currentGroupCount;
				}
				else
				{
					if(currentGroupCount > 0)
					{
						let v = new Vector3(x * .15, 
							(this.CurrentHeight-1) * .15 + .1 + .15 * numGroups, 
							0);
						this.CreateHint(currentGroupCount, v, hints, true );

						currentGroupCount = 0;
						numGroups++;
					}
				}
			}

			if(numGroups === 0 || currentGroupCount > 0)
			{
				let v = new Vector3(x * .15, 
					(this.CurrentHeight-1) * .15 + .1 + .15 * numGroups, 
					0);
				this.CreateHint(currentGroupCount, v, hints, true );
			}
		}
	}

	private CheckVictoryPattern()
	{
		if(!this.EditMode)
		{
			let victory = true;
			for (let i = 0; i < this.GameBoard.length; i++) {
				for (let j = 0; j < this.GameBoard[i].length; j++) {
					const element = this.GameBoard[i][j];
					let condition = this.VictoryCondition[i][j];
					if(condition === 0 && element.currentState !== BlockState.Empty)
					{
						victory = false;
						break;
					}
					else if(condition === 1 && element.currentState !== BlockState.Filled)
					{
						victory = false;
						break;
					}
				}	
			}

			if(victory)
			{
				this.CreateVictoryAnimation();
				this.DestroyGameBoard();
				this.DestroyHints();
				
				if(++this.PuzzleIndex < this.CurrentPuzzleSet.puzzles.length)
				{
					this.ResetVictoryCondition();
					this.CreateGameBoard();
					this.CreateHints();
				}
				else
				{
					this.CreateVictoryText();
					this.InputControlCube.actor.appearance.enabled = false;
					this.InputControlCubeText.appearance.enabled = false;
				}
			}
		}
	}

	private CheckVictoryBlackout()
	{
		let victory = true;
		this.GameBoard.forEach(boardRow => {
			boardRow.forEach(cube => {
				if(cube.currentState !== BlockState.Filled)
				{
					victory = false;
				}
			});
		});

		if(victory)
		{
			this.CreateVictoryAnimation();
			this.CreateVictoryText();
		}
	}

	private CreateVictoryText()
	{

		this.VictoryText = Actor.Create(this.context, {
			actor: {
				name: 'VictoryText',

				transform: {
					local: { position: { x: 0, y: 0, z: 0 } }
				},
				text: {
					contents: "VICTORIOUS!",
					anchor: TextAnchorLocation.BottomCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 1.2
				}
			}
		});

		this.SceneEffects.push(this.VictoryText);
		
	}

	private CreateVictoryAnimation()
	{
		//First, hide game board and create RBs from filled blocks
		this.GameBoard.forEach(boardRow => {
			boardRow.forEach(cube => {
				cube.actor.appearance.enabled = false;
				if(cube.currentState === BlockState.Filled)
				{
					let localPos = cube.actor.transform.local.position;
					localPos.z += .2;
					//Create RB
					let localRB = Actor.Create(this.context, {
						actor: {
							collider: {geometry: {shape: ColliderType.Box}},
							transform: {
								local: {position: localPos , scale:{ x: .1, y: .1, z: .1}}
							},
							
							rigidBody: {
								enabled: true, 
								velocity: {x: 0, y: 2, z: 10},
								detectCollisions: true, 
								
								collisionDetectionMode: CollisionDetectionMode.ContinuousDynamic },
							appearance: {
								meshId: this.CubeMesh.id,
								materialId: this.BlackSolidMaterial.id
							}
						}
					});
					this.SceneEffects.push(localRB);
				}
			});
		});



	}

	private SetCubeState(cube: GameBoardPiece, state: BlockState)
	{
		switch(state)
		{
			case BlockState.Filled:
				this.FillInAnimation(cube);
				break;
			case BlockState.Empty:
				this.ResetAnimation(cube);
				break;
			case BlockState.RuledOut:
				this.RuleOutAnimation(cube);
				break;
		}	
	}

	private UpdateControlText()
	{
		switch(this.CurrentInputState)
		{
			case BlockState.Filled:
				this.InputControlCubeText.text.contents = "Fill In";
				break;
			case BlockState.Empty:
				this.InputControlCubeText.text.contents = "Erase";
				break;
			case BlockState.RuledOut:
				this.InputControlCubeText.text.contents = "Rule-Out";
				break;
		}
	}

	private AnimateActorLocalRotation(actor: Actor, localRotation: Quaternion, dt: float = .3)
	{
		let CurrentRotation: Quaternion = actor.transform.local.rotation;
		let TargetRotation: Quaternion = CurrentRotation.add(localRotation);
		actor.animateTo(
			{ transform: { local: { rotation: TargetRotation } } },
			dt,
			AnimationEaseCurves.EaseOutSine);
	}

	private FillInAnimation(cube: GameBoardPiece)
	{
		cube.actor.appearance.materialId = this.BlackSolidMaterial.id;

		cube.actor.enableAnimation("FillIn");
		//this.AnimateActorLocalRotation(actor, Quaternion.RotationAxis(Vector3.Up(), 90));
	}
	
	private ResetAnimation(cube: GameBoardPiece)
	{
		cube.actor.appearance.materialId = this.WhiteSolidMaterial.id;
		cube.actor.enableAnimation("Erase");
		//this.AnimateActorLocalRotation(actor, Quaternion.RotationAxis(Vector3.Up(), -90));
	}

	private RuleOutAnimation(cube: GameBoardPiece)
	{
		cube.actor.appearance.materialId = this.GreyTransparentMaterial.id;
		cube.actor.enableAnimation("RuleOut");
		//this.AnimateActorLocalRotation(actor, Quaternion.RotationAxis(Vector3.Right(), 90));
	}

	private generateSpinFrames(duration: number, axis: Vector3): AnimationKeyframe[] {
		return [{
			time: 0,
			value: { transform: { local: { rotation: Quaternion.Identity() } } }
		}, {
			time:  duration,
			value: { transform: { local: { rotation: Quaternion.RotationAxis(axis, Math.PI / 2) } } },
			
		}];
	}
	//#endregion
}

/**
 * The main class of this app. All the logic goes here.
 */
class HelloWorld {
	private text: Actor = null;
	private cube: Actor = null;

	constructor(private context: Context, private baseUrl: string) {
		this.context.onStarted(() => this.started());
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private started() {
		// Create a new actor with no mesh, but some text.
		this.text = Actor.Create(this.context, {
			actor: {
				name: 'Text',
				transform: {
					app: { position: { x: 0, y: 0.5, z: 0 } }
				},
				text: {
					contents: "Hello World!",
					anchor: TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 0.3
				}
			}
		});

		// Here we create an animation on our text actor. Animations have three mandatory arguments:
		// a name, an array of keyframes, and an array of events.
		this.text.createAnimation(
			// The name is a unique identifier for this animation. We'll pass it to "startAnimation" later.
			"Spin", {
				// Keyframes define the timeline for the animation: where the actor should be, and when.
				// We're calling the generateSpinKeyframes function to produce a simple 20-second revolution.
				keyframes: this.generateSpinKeyframes(20, Vector3.Up()),
				// Events are points of interest during the animation. The animating actor will emit a given
				// named event at the given timestamp with a given string value as an argument.
				events: [],

				// Optionally, we also repeat the animation infinitely. PingPong alternately runs the animation
				// foward then backward.
				wrapMode: AnimationWrapMode.PingPong
			});

		// Load a glTF model
		this.cube = Actor.CreateFromGltf(new AssetContainer(this.context), {
			// at the given URL
			uri: `${this.baseUrl}/altspace-cube.glb`,
			// and spawn box colliders around the meshes.
			colliderType: 'box',
			// Also apply the following generic actor properties.
			actor: {
				name: 'Altspace Cube',
				// Parent the glTF model to the text actor.
				parentId: this.text.id,
				transform: {
					local: {
						position: { x: 0, y: -1, z: 0 },
						scale: { x: 0.4, y: 0.4, z: 0.4 }
					}
				}
			}
		});

		// Create some animations on the cube.
		this.cube.createAnimation(
			'DoAFlip', {
				keyframes: this.generateSpinKeyframes(1.0, Vector3.Right()),
				events: []
			});

		// Now that the text and its animation are all being set up, we can start playing
		// the animation.
		this.text.enableAnimation('Spin');

		// Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
		// Button behaviors have two pairs of events: hover start/stop, and click start/stop.
		const buttonBehavior = this.cube.setBehavior(ButtonBehavior);

		// Trigger the grow/shrink animations on hover.
		buttonBehavior.onHover('enter', () => {
			this.cube.animateTo(
				{ transform: { local: { scale: { x: 0.5, y: 0.5, z: 0.5 } } } }, 0.3, AnimationEaseCurves.EaseOutSine);
		});
		buttonBehavior.onHover('exit', () => {
			this.cube.animateTo(
				{ transform: { local: { scale: { x: 0.4, y: 0.4, z: 0.4 } } } }, 0.3, AnimationEaseCurves.EaseOutSine);
		});

		// When clicked, do a 360 sideways.
		buttonBehavior.onClick(_ => {
			this.cube.enableAnimation('DoAFlip');
		});
	}

	/**
	 * Generate keyframe data for a simple spin animation.
	 * @param duration The length of time in seconds it takes to complete a full revolution.
	 * @param axis The axis of rotation in local space.
	 */
	private generateSpinKeyframes(duration: number, axis: Vector3): AnimationKeyframe[] {
		return [{
			time: 0 * duration,
			value: { transform: { local: { rotation: Quaternion.RotationAxis(axis, 0) } } }
		}, {
			time: 0.25 * duration,
			value: { transform: { local: { rotation: Quaternion.RotationAxis(axis, Math.PI / 2) } } }
		}, {
			time: 0.5 * duration,
			value: { transform: { local: { rotation: Quaternion.RotationAxis(axis, Math.PI) } } }
		}, {
			time: 0.75 * duration,
			value: { transform: { local: { rotation: Quaternion.RotationAxis(axis, 3 * Math.PI / 2) } } }
		}, {
			time: 1 * duration,
			value: { transform: { local: { rotation: Quaternion.RotationAxis(axis, 2 * Math.PI) } } }
		}];
	}
}
