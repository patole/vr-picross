"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const mixed_reality_extension_sdk_1 = require("@microsoft/mixed-reality-extension-sdk");
//Todo for Picross:
//1: Interactable Cube
/// ? Create Template cube - DONE
//TODO: Animations, not getting the right rotations :(
/// - Click to animate and change color - "Fill In"
/// - Click to animate and change to wireframe - "Rule Out"
/// - Modality choice (different buttons?)
//2: Group of Cubes:
/// - Line
/// - Array
//3: Victory Condition:
/// - Blackout (All filled)
/// - Pattern (Match internal pattern of yes/No, prereq for labels)
//4: Labels:
/// - Floating labels next to cube array
/// - Allow crossing out with interaction
/// - Auto cross out on filling the row correctly
//5: Wow factor
/// - Sounds
/// - Animations
/// - Rigid Body on victory
var BlockState;
(function (BlockState) {
    BlockState[BlockState["Filled"] = 0] = "Filled";
    BlockState[BlockState["Empty"] = 1] = "Empty";
    BlockState[BlockState["RuledOut"] = 2] = "RuledOut";
})(BlockState || (BlockState = {}));
class GameBoardPiece {
}
class Hint {
}
class HintSet {
    constructor(horiz) {
        this.isHorizontal = true;
        this.isHorizontal = horiz;
    }
}
class PicrossApp {
    //Constructor
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        //Private Members
        this.CubeAssets = null;
        this.WhiteSolidMaterial = null;
        this.BlackSolidMaterial = null;
        this.GreyTransparentMaterial = null;
        this.CubeMesh = null;
        this.InputControlCube = null;
        this.InputControlCubeText = null;
        // 2d Array of Game board Pieces
        this.GameBoard = null;
        this.HorizontalHints = null;
        this.VerticalHints = null;
        // Current Solution, this is what gets encoded in the end
        this.CurrentSolution = null;
        this.CurrentWidth = 10;
        this.CurrentHeight = 10;
        this.CurrentInputState = BlockState.Filled;
        this.CubeAssets = new mixed_reality_extension_sdk_1.AssetContainer(context);
        this.context.onStarted(() => this.started());
    }
    //Methods
    started() {
        this.BlackSolidMaterial = this.CubeAssets.createMaterial("BlackMaterial", {
            color: mixed_reality_extension_sdk_1.Color3.Black(), alphaMode: mixed_reality_extension_sdk_1.AlphaMode.Opaque,
        });
        this.WhiteSolidMaterial = this.CubeAssets.createMaterial("WhiteMaterial", {
            color: mixed_reality_extension_sdk_1.Color3.White(), alphaMode: mixed_reality_extension_sdk_1.AlphaMode.Opaque
        });
        this.GreyTransparentMaterial = this.CubeAssets.createMaterial("GreyMaterial", {
            color: mixed_reality_extension_sdk_1.Color4.FromColor3(mixed_reality_extension_sdk_1.Color3.Gray(), .4), alphaMode: mixed_reality_extension_sdk_1.AlphaMode.Blend
        });
        this.CubeMesh = this.CubeAssets.createBoxMesh("BoxMesh", 1, 1, 1);
        this.InputControlCube = mixed_reality_extension_sdk_1.Actor.Create(this.context, {
            actor: {
                collider: { geometry: { shape: mixed_reality_extension_sdk_1.ColliderType.Box } },
                transform: {
                    local: { position: { x: -1, y: -1, z: 0 }, scale: { x: .1, y: .1, z: .1 } }
                },
                name: 'InputControlCube',
                appearance: {
                    meshId: this.CubeMesh.id,
                    materialId: this.WhiteSolidMaterial.id
                }
            }
        });
        this.InputControlCubeText = mixed_reality_extension_sdk_1.Actor.Create(this.context, {
            actor: {
                name: 'Text',
                parentId: this.InputControlCube.id,
                transform: {
                    local: { position: { x: 0, y: 1, z: 0 } }
                },
                text: {
                    contents: "UNSET!",
                    anchor: mixed_reality_extension_sdk_1.TextAnchorLocation.MiddleCenter,
                    color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
                    height: 1
                }
            }
        });
        // Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
        // Button behaviors have two pairs of events: hover start/stop, and click start/stop.
        const inputControlBehavior = this.InputControlCube.setBehavior(mixed_reality_extension_sdk_1.ButtonBehavior);
        inputControlBehavior.onClick(_ => {
            switch (this.CurrentInputState) {
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
        this.CreateGameBoard();
    }
    //TODO NEXT
    CreateGameBoard() {
        this.GameBoard = new Array(this.CurrentHeight);
        for (let i = 0; i < this.CurrentHeight; ++i) {
            this.GameBoard[i] = new Array(this.CurrentWidth);
            for (let j = 0; j < this.CurrentWidth; ++j) {
                let cube = new GameBoardPiece();
                cube.actor = mixed_reality_extension_sdk_1.Actor.Create(this.context, {
                    actor: {
                        collider: { geometry: { shape: mixed_reality_extension_sdk_1.ColliderType.Box } },
                        transform: {
                            local: { position: { x: j * .15, y: 0 + i * .15, z: 0 }, scale: { x: .1, y: .1, z: .1 } }
                        },
                        name: 'GameBoardPiece',
                        appearance: {
                            meshId: this.CubeMesh.id,
                            materialId: this.WhiteSolidMaterial.id
                        }
                    }
                });
                const gameBoardBehavior = cube.actor.setBehavior(mixed_reality_extension_sdk_1.ButtonBehavior);
                gameBoardBehavior.onClick(_ => {
                    if (cube.currentState !== this.CurrentInputState) {
                        cube.currentState = this.CurrentInputState;
                        this.SetCubeState(cube.actor, cube.currentState);
                    }
                });
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
    SetCubeState(actor, state) {
        switch (state) {
            case BlockState.Filled:
                this.FillInAnimation(actor);
                break;
            case BlockState.Empty:
                this.ResetAnimation(actor);
                break;
            case BlockState.RuledOut:
                this.RuleOutAnimation(actor);
                break;
        }
    }
    UpdateControlText() {
        switch (this.CurrentInputState) {
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
    AnimateActorLocalRotation(actor, localRotation, dt = .3) {
        let CurrentRotation = actor.transform.local.rotation;
        let TargetRotation = CurrentRotation.add(localRotation);
        actor.animateTo({ transform: { local: { rotation: TargetRotation } } }, dt, mixed_reality_extension_sdk_1.AnimationEaseCurves.EaseOutSine);
    }
    FillInAnimation(actor) {
        actor.appearance.materialId = this.BlackSolidMaterial.id;
        actor.transform.local.rotation.set(0, 0, 0, 1);
        //this.AnimateActorLocalRotation(actor, Quaternion.RotationAxis(Vector3.Up(), 90));
    }
    ResetAnimation(actor) {
        actor.appearance.materialId = this.WhiteSolidMaterial.id;
        actor.transform.local.rotation.set(0, 0, 0, 1);
        //this.AnimateActorLocalRotation(actor, Quaternion.RotationAxis(Vector3.Up(), -90));
    }
    RuleOutAnimation(actor) {
        actor.appearance.materialId = this.GreyTransparentMaterial.id;
        actor.transform.local.rotation.set(0, 0, 0, 1);
        //this.AnimateActorLocalRotation(actor, Quaternion.RotationAxis(Vector3.Right(), 90));
    }
}
exports.default = PicrossApp;
/**
 * The main class of this app. All the logic goes here.
 */
class HelloWorld {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.text = null;
        this.cube = null;
        this.context.onStarted(() => this.started());
    }
    /**
     * Once the context is "started", initialize the app.
     */
    started() {
        // Create a new actor with no mesh, but some text.
        this.text = mixed_reality_extension_sdk_1.Actor.Create(this.context, {
            actor: {
                name: 'Text',
                transform: {
                    app: { position: { x: 0, y: 0.5, z: 0 } }
                },
                text: {
                    contents: "Hello World!",
                    anchor: mixed_reality_extension_sdk_1.TextAnchorLocation.MiddleCenter,
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
            keyframes: this.generateSpinKeyframes(20, mixed_reality_extension_sdk_1.Vector3.Up()),
            // Events are points of interest during the animation. The animating actor will emit a given
            // named event at the given timestamp with a given string value as an argument.
            events: [],
            // Optionally, we also repeat the animation infinitely. PingPong alternately runs the animation
            // foward then backward.
            wrapMode: mixed_reality_extension_sdk_1.AnimationWrapMode.PingPong
        });
        // Load a glTF model
        this.cube = mixed_reality_extension_sdk_1.Actor.CreateFromGltf(new mixed_reality_extension_sdk_1.AssetContainer(this.context), {
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
        this.cube.createAnimation('DoAFlip', {
            keyframes: this.generateSpinKeyframes(1.0, mixed_reality_extension_sdk_1.Vector3.Right()),
            events: []
        });
        // Now that the text and its animation are all being set up, we can start playing
        // the animation.
        this.text.enableAnimation('Spin');
        // Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
        // Button behaviors have two pairs of events: hover start/stop, and click start/stop.
        const buttonBehavior = this.cube.setBehavior(mixed_reality_extension_sdk_1.ButtonBehavior);
        // Trigger the grow/shrink animations on hover.
        buttonBehavior.onHover('enter', () => {
            this.cube.animateTo({ transform: { local: { scale: { x: 0.5, y: 0.5, z: 0.5 } } } }, 0.3, mixed_reality_extension_sdk_1.AnimationEaseCurves.EaseOutSine);
        });
        buttonBehavior.onHover('exit', () => {
            this.cube.animateTo({ transform: { local: { scale: { x: 0.4, y: 0.4, z: 0.4 } } } }, 0.3, mixed_reality_extension_sdk_1.AnimationEaseCurves.EaseOutSine);
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
    generateSpinKeyframes(duration, axis) {
        return [{
                time: 0 * duration,
                value: { transform: { local: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, 0) } } }
            }, {
                time: 0.25 * duration,
                value: { transform: { local: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, Math.PI / 2) } } }
            }, {
                time: 0.5 * duration,
                value: { transform: { local: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, Math.PI) } } }
            }, {
                time: 0.75 * duration,
                value: { transform: { local: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, 3 * Math.PI / 2) } } }
            }, {
                time: 1 * duration,
                value: { transform: { local: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, 2 * Math.PI) } } }
            }];
    }
}
//# sourceMappingURL=app.js.map