var gl,
    program,
    groundProgram,
    mModelViewLoc,
    modelView = mat4(),
    mProjection,
    mProjectionLoc, 
    mNormals,
    mNormalsLoc,
    mView,
    mViewLoc,
    mViewNormals,
    mViewNormalsLoc,
    canvas;

var matrixStack = [];
var zoom, aspect;
   
var tooLow = false;
var typeOfView = "persp";
var orientation=0;
var pos = [0,0,0];
var lightOn = true;
var count = 0;
var motor = 0;
var leme = 0;
var elevator = 0;
var airelons = 0;
var airelonsRot = 0;
var propulsao = 0;
var wheelsmove = 0;
//Variaveis auxiliares para o chao
var lado = 50;
var horizontal = [lado, 0, -lado]; 
var vertical = [-lado, 0, lado]; 
var limitInfVert = -(lado/2);
var limitSupVert = (lado/2);
var centerVert = 0;
var limitInfHoriz = -(lado/2);
var limitSupHoriz = (lado/2);
var centerHoriz = 0;

//Cores
var cinzento = [0.7, 0.7, 0.7];
var cinzentoAsas = [0.45, 0.45, 0.45];
var cinzentoEscuro = [0.3, 0.3, 0.3];
var azul = [ 0, 0, 0] ;
var preto = [0.2, 0.2, 0.2];
var type = true;

// Stack related operations
function pushMatrix() {
    var m =  mat4(modelView[0], modelView[1],
           modelView[2], modelView[3]);
    matrixStack.push(m);
}
function popMatrix() {
    modelView = matrixStack.pop();
}
// Append transformations to modelView
function multMatrix(m) {
    modelView = mult(modelView, m);
}
function multTranslation(t) {
    modelView = mult(modelView, translate(t));
}
function multScale(s) { 
    modelView = mult(modelView, scalem(s)); 
}
function multRotationX(angle) {
    modelView = mult(modelView, rotateX(angle));
}
function multRotationY(angle) {
    modelView = mult(modelView, rotateY(angle));
}
function multRotationZ(angle) {
    modelView = mult(modelView, rotateZ(angle));
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight*0.99;

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    //Inicializam os buffers com a geometria dos respetivos objetos
    cubeInit(gl);
    sphereInit(gl);
    bunnyInit(gl);
    torusInit(gl);
    cylinderInit(gl);
    superquadricInit(gl, 0.55, 0.83);
    pyramidInit(gl);
    coneInit(gl);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    groundProgram = initShaders(gl, 'groundVertex-shader', 'groundFragment-shader');
	
    gl.useProgram(groundProgram);
	setupTexture();
    gl.useProgram(program);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");        
    
    mNormalsLoc = gl.getUniformLocation(program, "mNormals");
    mViewLoc = gl.getUniformLocation(program, "mView");
    mViewNormalsLoc = gl.getUniformLocation(program, "mViewNormals");
    
    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    var eye = [0, 1, 1];
    var at = [0, 0, 0];
    var up = [0, 1, 0];
    modelView = lookAt(eye, at, up);
    
    zoom = 2.0;
    aspect = canvas.width/canvas.height;
    mProjection= ortho(-2*zoom, 2*zoom, -(2/aspect)*zoom, (2/aspect)*zoom, -10, 10);
    
    activateLights();
    
    render();
};

function render() {
    gl.useProgram(program);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));

    pos[0] = pos[0] + Math.cos(radians(orientation)) * (propulsao/1000);
    pos[1] = pos[1] + Math.sin(radians(orientation)) * (propulsao/1000);
    motor+=propulsao;
    if(pos[2]<=0){
        wheelsmove-= (propulsao/5);
    }
    changeIt();
    normalizePlane();
    projection();
    draw();

    mProjection= ortho(-2*zoom, 2*zoom, -(2/aspect)*zoom, (2/aspect)*zoom, -10, 10);
    window.requestAnimationFrame(render);
}

//Funcao que desenha o chao e o aviao
function draw(){
    pushMatrix();
        drawGround();
    popMatrix();
    
    pushMatrix();
        multTranslation([pos[1],pos[2],pos[0]]);      
        pushMatrix();
            multRotationY(orientation);
                pushMatrix();
                    multRotationZ(airelonsRot);
                    pushMatrix();
                        bodyOfPlane();
                    popMatrix();
            popMatrix();
    popMatrix();  

}

function normalizePlane(){
    if(leme>0)
        leme -=0.4;
    if(leme<0)
        leme +=0.4;
    if( airelons>0)
         airelons -= 0.4;
    if( airelons<0)
         airelons+=0.4;
    if( airelonsRot>0)
         airelonsRot -= 0.4;
    if( airelonsRot<0)
         airelonsRot+=0.4;    
    if(elevator>0)
        elevator -=2;
    if(elevator<0)
        elevator+=2;
}

//Funcao para desenhar o chao
function drawGround() {
	
    if(pos[0]<limitInfVert){
        centerVert-=lado;
        limitSupVert-=lado;
        limitInfVert-=lado;
    }
    if(pos[0]>limitSupVert){
        centerVert+=lado;
        limitSupVert+=lado;
        limitInfVert+=lado;
    }
    if(pos[1]<limitInfHoriz){
        centerHoriz-=lado;
        limitSupHoriz-=lado;
        limitInfHoriz-=lado;
    }
    if(pos[1]>limitSupHoriz){
        centerHoriz+=lado;
        limitSupHoriz+=lado;
        limitInfHoriz+=lado;
    }
    gl.useProgram(groundProgram);
	pushMatrix();
        multTranslation([centerHoriz,-0.32,centerVert]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(groundProgram, "texture"), 0);
        gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "mProjection"), false, flatten(mProjection));
        pushMatrix();
            multTranslation([vertical[0], 0, horizontal[0]]);
            multScale([lado,0.02,lado]);
            gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "mModelView"), false, flatten(modelView));
            cubeDraw(gl, groundProgram, true);
        popMatrix();
        pushMatrix();
            multTranslation([vertical[1], 0, horizontal[0]]);
            multScale([lado,0.02,lado]);
            gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "mModelView"), false, flatten(modelView));
            cubeDraw(gl, groundProgram, true);
        popMatrix();
        pushMatrix();
            multTranslation([vertical[2], 0, horizontal[0]]);
            multScale([lado,0.02,lado]);
            gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "mModelView"), false, flatten(modelView));
            cubeDraw(gl, groundProgram, true);
        popMatrix();
        pushMatrix();
            multTranslation([vertical[0], 0, horizontal[1]]);
            multScale([lado,0.02,lado]);
            gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "mModelView"), false, flatten(modelView));
            cubeDraw(gl, groundProgram, true);
        popMatrix();
        pushMatrix();
            multTranslation([vertical[1], 0, horizontal[1]]);
            multScale([lado,0.02,lado]);
            gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "mModelView"), false, flatten(modelView));
            cubeDraw(gl, groundProgram, true);
        popMatrix();
        pushMatrix();
            multTranslation([vertical[2], 0, horizontal[1]]);
            multScale([lado,0.02,lado]);
            gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "mModelView"), false, flatten(modelView));
            cubeDraw(gl, groundProgram, true);
        popMatrix();
        pushMatrix();
            multTranslation([vertical[0], 0, horizontal[2]]);
            multScale([lado,0.02,lado]);
            gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "mModelView"), false, flatten(modelView));
            cubeDraw(gl, groundProgram, true);
        popMatrix();
        pushMatrix();
            multTranslation([vertical[1], 0, horizontal[2]]);
            multScale([lado,0.02,lado]);
            gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "mModelView"), false, flatten(modelView));
            cubeDraw(gl, groundProgram, true);
        popMatrix();
        pushMatrix();
            multTranslation([vertical[2], 0, horizontal[2]]);
            multScale([lado,0.02,lado]);
            gl.uniformMatrix4fv(gl.getUniformLocation(groundProgram, "mModelView"), false, flatten(modelView));
            cubeDraw(gl, groundProgram, true);
        popMatrix();
	popMatrix();
    gl.useProgram(program);
}
//Funcao para desenhar o aviao
function bodyOfPlane(){

//CORPO DO AVIAO    
    planeBody();   
    
//ASAS DO AVIAO
    //lado direito
    rightWing();  
    //lado esquerdo
    leftWing();  
        
//ESTABILIZADOR VERTICAL
    //suporte
    backSupport();

//ESTABILIZADOR HORIZONTAL
    //lado direito
    rightBackWingsSuport();  

    //lado esquerdo
    leftBackWingsSuport();  


//RODAS
    //rodas da frente
    frontWheel();    
    //rodas de trás direita
    backRightWheel(); 
    //rodas de trás esquerda
    backLeftWheel(); 

//MOTORES + HELICES
    pushMatrix();
        multTranslation([0, 0.08, 0]); 
        //motor, helice direita
        rightMotor();  
        //motor, helice esquerda
        leftMotor();      
    popMatrix();  
    
//LUZES
    lights();  
}

//CORPO DO AVIAO    
function planeBody() {
    //CORPO    
    pushMatrix();
        multScale([0.4, 0.4, 2]);
        multRotationX(90);
        mySuper(gl, program, modelView, 0.55, 0.83, cinzento);
    popMatrix();
    pushMatrix();
        multScale([0.1, 0.1, 0.52]);
        multRotationX(95);
        multTranslation([0,-1.2,1.5]);
        mySuper(gl, program, modelView, 0.55, 0.83, cinzento);
    popMatrix();
    //NARIZ DO AVIAO (COCKPIT)
    pushMatrix();
        multScale([0.3, 0.28, 0.5]);
        multTranslation([0,-0.15,-1.7]);
        mySphere(gl, program, modelView, cinzento);    
    popMatrix();
}
//ASAS DO AVIAO (direita)
function rightWing() {
    pushMatrix();
        multTranslation([0.7 ,0,0]);
        pushMatrix();
            multTranslation([0 ,0,-0.1]);
            multRotationY(-25);
            multScale([1.4, 0.05, 0.3]);
            myCube(gl, program, modelView, cinzentoAsas);    
        popMatrix();  

        pushMatrix();
            multTranslation([0, 0, 0.07]);
            multRotationY(-15);
            multScale([1.4, 0.05, 0.21]);
            myCube(gl, program, modelView,cinzentoAsas);    
        popMatrix();  

        //parte de fora da asa (limite)   
        pushMatrix();
            multTranslation([0.681 ,0,0.261]);
            multRotationY(10);
            multScale([0.1, 0.05, 0.395]);
            myCube(gl, program, modelView, cinzentoAsas);    
        popMatrix();  
    popMatrix();  

    //FLAPS E AILERONS
    //FLAP LADO DIREITO
    pushMatrix();
        multRotationY(-15);
        multTranslation([0.5, 0, 0]);
        pushMatrix();
            multRotationX(0);
            multTranslation([0, 0, 0.048]);
            multScale([0.45, 0.02, 0.10]);  
            myCube(gl, program, modelView,cinzentoEscuro);    
        popMatrix();  

    //AILERON LADO DIREITO
        pushMatrix();
            multRotationX(airelons);
            multTranslation([0.55, 0, 0.048]);
            multScale([0.3, 0.02, 0.10]);        
            myCube(gl, program, modelView,cinzentoEscuro);    
        popMatrix();  
    popMatrix();
}
//ASAS DO AVIAO (esquerda)
function leftWing() {
    pushMatrix();
        multTranslation([-0.7 ,0,0]);
            multRotationZ(180);

        pushMatrix();
            multTranslation([0 ,0,-0.1]);
            multRotationY(-25);
            multScale([1.4, 0.05, 0.3]);
            myCube(gl, program, modelView, cinzentoAsas);    
        popMatrix();  

        pushMatrix();
            multTranslation([0, 0, 0.07]);
            multRotationY(-15);
            multScale([1.4, 0.05, 0.21]);
            myCube(gl, program, modelView,cinzentoAsas);    
        popMatrix();  

        //parte de fora da asa (limite)   
        pushMatrix();
            multTranslation([0.681 ,0,0.261]);
            multRotationY(10);
            multScale([0.1, 0.05, 0.395]);
            myCube(gl, program, modelView, cinzentoAsas);    
        popMatrix();  
    popMatrix();  

    //FLAPS E AILERONS
    //FLAP LADO ESQUERDO
    pushMatrix();
        multRotationY(15);
        multTranslation([-0.5, 0, 0]);
        pushMatrix();
            multRotationX(0);
            multTranslation([0, 0, 0.048]);
            multScale([0.45, 0.02, 0.10]);  
            myCube(gl, program, modelView,cinzentoEscuro);    
        popMatrix();  
    
        //AILERON LADO ESQUERDO
        pushMatrix();
            multRotationX(-airelons);
            multTranslation([-0.55, 0, 0.048]);
            multScale([0.3, 0.02, 0.10]);        
            myCube(gl, program, modelView,cinzentoEscuro);    
        popMatrix();  
    popMatrix();
    
}
//ESTABILIZADOR VERTICAL
function backSupport() {
    pushMatrix();
        multTranslation([0, 0,0.7]);
        multRotationX(90);
        multScale([0.36, 1.8, 0.36]);        
        mySuper(gl, program, modelView, 1.5, 0.6, cinzento);
    popMatrix();

    //parte 1
    pushMatrix();
        multTranslation([0, 0.3, 1.07]);
        multRotationX(30);
        multScale([0.05, 0.6, 0.1]);        
        myCube(gl, program, modelView, preto);
    popMatrix();

    //parte 2
    pushMatrix();
        multTranslation([0, 0.25, 1.1]);
        multRotationX(30);
        multScale([0.05, 0.3, 0.15]);        
        myCube(gl, program, modelView,preto);
    popMatrix();

    //parte 3
    pushMatrix();
        multTranslation([0, 0.3, 1.2]);
        multRotationX(10);
        multScale([0.05, 0.5, 0.1]);        
        myCube(gl, program, modelView, preto);
    popMatrix();
    //parte de cima
    pushMatrix();
        multTranslation([0, 0.55, 1.29]);
        multRotationX(90);
        multScale([0.05, 0.23, 0.07]);        
        myCube(gl, program, modelView,preto);
    popMatrix();
    
    //leme do aviao
    pushMatrix();
        multTranslation([0, 0.318, 1.262])
        pushMatrix();
            multRotationX(10)
            multRotationY(leme);
            multTranslation([0, 0, 0.05])
            multScale([0.02, 0.44, 0.11]);
            myCube(gl, program, modelView, cinzentoEscuro);
        popMatrix();
    popMatrix();


}
//ESTABILIZADOR HORIZONTAL (direito)
function rightBackWingsSuport() {
    pushMatrix();
    multTranslation([0.4 ,0,1.3]);
    multRotationY(-25);
    multScale([0.7, 0.05, 0.15]);
    myCube(gl, program, modelView,cinzentoAsas);    
    popMatrix();  

    pushMatrix();
    multTranslation([0.4, 0, 1.37]);
    multRotationY(-15);
    multScale([0.7, 0.05, 0.13]);
    myCube(gl, program, modelView,cinzentoAsas);    
    popMatrix();  

    //parte de fora da asa (limite)   
    pushMatrix();
    multTranslation([0.73 ,0,1.52]);
    //multRotationY(10);
    multScale([0.05, 0.05, 0.27]);
    myCube(gl, program, modelView,cinzentoAsas);    
    popMatrix();
    
    //flap de tras
    pushMatrix();
        multTranslation([0, 0, 1.348])
        pushMatrix();
            multRotationY(-15);    
            pushMatrix();
                multRotationX(elevator);
                multTranslation([0.41, 0, 0.048]);
                multScale([0.68, 0.02, 0.115]);
                myCube(gl, program, modelView,cinzentoEscuro);    
            popMatrix();  
        popMatrix();  
    popMatrix();    
    

}
//ESTABILIZADOR HORIZONTAL (esquerdo)
function leftBackWingsSuport() {
    pushMatrix();
    multTranslation([-0.4 ,0,1.3]);
    multRotationY(25);
    multScale([0.7, 0.05, 0.15]);
    myCube(gl, program, modelView,cinzentoAsas);    
    popMatrix();  

    pushMatrix();
    multTranslation([-0.4, 0, 1.37]);
    multRotationY(15);
    multScale([0.7, 0.05, 0.13]);
    myCube(gl, program, modelView,cinzentoAsas);    
    popMatrix();  

    //parte de fora da asa (limite)   
    pushMatrix();
    multTranslation([-0.73 ,0,1.52]);
    multScale([0.05, 0.05, 0.27]);
    myCube(gl, program, modelView,cinzentoAsas);    
    popMatrix();
    
    //flap de tras
    pushMatrix();
        multTranslation([0, 0, 1.348])
        pushMatrix();
            multRotationY(15);    
            pushMatrix();
                multRotationX(elevator);
                multTranslation([-0.41, 0, 0.048]);
                multScale([0.68, 0.02, 0.115]);
                myCube(gl, program, modelView,cinzentoEscuro);    
            popMatrix();  
        popMatrix();  
    popMatrix();  
}
//RODA (frente)
function frontWheel() {
    
    pushMatrix();
        multTranslation([0, -0.28, -0.75])
        //Rotacao para os lados (virar no chao)
        multRotationY(-leme);
        pushMatrix();
            multTranslation([-0.03, 0, 0]);
            multRotationX(- wheelsmove);
            multRotationZ(90);
            multScale([0.06, 0.02, 0.06]);
            myCylinder(gl, program, modelView);    
        popMatrix();      

        pushMatrix();
            multTranslation([0.03, 0, 0]);
            multRotationX(- wheelsmove);
            multRotationZ(90);
            multScale([0.06, 0.02, 0.06]);
            myCylinder(gl, program, modelView);    
        popMatrix();    

        pushMatrix();
            multRotationX(- wheelsmove);
            multRotationZ(90);
            multScale([0.01, 0.08, 0.01]);
            myCylinder(gl, program, modelView);    
        popMatrix(); 
    popMatrix();

    //LIGACAO
    pushMatrix();
        multTranslation([0, -0.22, -0.75]);
        multScale([0.01, 0.11, 0.01]);
        myCylinder(gl, program, modelView);    
    popMatrix();
}
//RODA (tras, direito)
function backRightWheel() {
        pushMatrix();

    pushMatrix();
        pushMatrix();
            multTranslation([0.63, -0.28, -0.05]);
            multRotationX(- wheelsmove);
            multRotationZ(90);
            multScale([0.06, 0.02, 0.06]);
            myCylinder(gl, program, modelView);    
        popMatrix();      
    popMatrix();      

    pushMatrix();
        multTranslation([0.57, -0.28, -0.05]);
        multRotationX(- wheelsmove);
        multRotationZ(90);
        multScale([0.06, 0.02, 0.06]);
        myCylinder(gl, program, modelView);    
    popMatrix();    

    pushMatrix();
        multTranslation([0.6, -0.28, -0.05]);
        multRotationZ(90);
        multScale([0.01, 0.08, 0.01]);
        myCylinder(gl, program, modelView);    
    popMatrix();    

    //SEGUNDA RODA
    pushMatrix();
        multTranslation([0.63, -0.28, -0.12]);
        multRotationX(- wheelsmove);
        multRotationZ(90);
        multScale([0.06, 0.02, 0.06]);
        myCylinder(gl, program, modelView);    
    popMatrix();      

    pushMatrix();
        multTranslation([0.57, -0.28, -0.12]);
        multRotationX(- wheelsmove);
        multRotationZ(90);
        multScale([0.06, 0.02, 0.06]);
        myCylinder(gl, program, modelView);    
    popMatrix();    

    pushMatrix();
        multTranslation([0.6, -0.28, -0.12]);
        multRotationX(- wheelsmove);
        multRotationZ(90);
        multScale([0.01, 0.08, 0.01]);
        myCylinder(gl, program, modelView);    
    popMatrix();  

    //LIGACAO DAS RODAS-AVIAO
    pushMatrix();
        multTranslation([0.6, -0.15, -0.085]);
        multScale([0.01, 0.25, 0.01]);
        myCylinder(gl, program, modelView);    
    popMatrix(); 

    pushMatrix();
        multTranslation([0.6, -0.28, -0.085]);
        multRotationX(90);
        multScale([0.01, 0.06, 0.01]);
        myCylinder(gl, program, modelView);    
    popMatrix();
}
//RODA (tras, esquerdo)
function backLeftWheel() {
    pushMatrix();
        multTranslation([-0.63, -0.28, -0.05]);
        multRotationX(- wheelsmove);
        multRotationZ(90);
        multScale([0.06, 0.02, 0.06]);
        myCylinder(gl, program, modelView);    
    popMatrix();      

    pushMatrix();
        multTranslation([-0.57, -0.28, -0.05]);
        multRotationX(- wheelsmove);
        multRotationZ(90);
        multScale([0.06, 0.02, 0.06]);
        myCylinder(gl, program, modelView);    
    popMatrix();    

    pushMatrix();
        multTranslation([-0.6, -0.28, -0.05]);
        multRotationX(- wheelsmove);
        multRotationZ(90);
        multScale([0.01, 0.08, 0.01]);
        myCylinder(gl, program, modelView);    
    popMatrix();    

    //SEGUNDA RODA
    pushMatrix();
        multTranslation([-0.63, -0.28, -0.12]);
        multRotationX(- wheelsmove);    
        multRotationZ(90);
        multScale([0.06, 0.02, 0.06]);
        myCylinder(gl, program, modelView);    
    popMatrix();      

    pushMatrix();
        multTranslation([-0.57, -0.28, -0.12]);
        multRotationX(- wheelsmove);
        multRotationZ(90);
        multScale([0.06, 0.02, 0.06]);
        myCylinder(gl, program, modelView);    
    popMatrix();    

    pushMatrix();
        multTranslation([-0.6, -0.28, -0.12]);
        multRotationX(- wheelsmove);    
        multRotationZ(90);
        multScale([0.01, 0.08, 0.01]);
        myCylinder(gl, program, modelView);    
    popMatrix();

    //LIGACAO DAS RODAS-AVIAO
    pushMatrix();
        multTranslation([-0.6, -0.15, -0.085]);
        multScale([0.01, 0.25, 0.01]);
        myCylinder(gl, program, modelView);    
    popMatrix(); 

    pushMatrix();
        multTranslation([-0.6, -0.28, -0.085]);
        multRotationX(90);
        multScale([0.01, 0.06, 0.01]);
        myCylinder(gl, program, modelView);    
    popMatrix();
}
//MOTOR + HELICE (esquerdo)
function leftMotor() {
    pushMatrix();
        multTranslation([-0.7, -0.1, -0.25]);
        multRotationX(90);
        multScale([0.15, 0.35, 0.15]);        
        mySuper(gl, program, modelView, 0.34, 1.01, preto);
    popMatrix();   
    
    //CONE DE LIGACAO
    pushMatrix();
        multTranslation([-0.7, -0.10, -0.45]);
        pushMatrix();
            multRotationZ(motor);    
            multTranslation([0, 0.09, 0])
            multScale([0.02, 0.18, 0.015]);
            mySphere(gl, program, modelView,preto);
        popMatrix();  
        pushMatrix();
            multRotationZ(120);
            multRotationZ(motor);    
            multTranslation([0, 0.09, 0])
            multScale([0.02, 0.18, 0.015]);
            mySphere(gl, program, modelView,preto);
        popMatrix();     
        pushMatrix();
            multRotationZ(240);
            multRotationZ(motor);    
            multTranslation([0, 0.09, 0])
            multScale([0.02, 0.18, 0.015]);
            mySphere(gl, program, modelView, preto);
        popMatrix(); 
        //SUPORTE HELICE
        pushMatrix();
            multTranslation([0, 0, 0.05]);
            multRotationZ(motor);    
            multScale([0.1, 0.1, 0.2]);
            multRotationX(90);
            mySuper(gl, program, modelView, 1.65, 0.99, cinzentoEscuro);
        popMatrix();
    popMatrix();  
}
//MOTOR + HELICE (direito)
function rightMotor() {
    pushMatrix();
        multTranslation([0.7, -0.1, -0.25]);
        multRotationX(90);
        multScale([0.15, 0.35, 0.15]);        
        mySuper(gl, program, modelView, 0.34, 1.01, preto);
    popMatrix(); 
    
    //CONE DE LIGACAO
    pushMatrix();
        multTranslation([0.7, -0.10, -0.45]);
        pushMatrix();
        multRotationZ(motor);    
            multTranslation([0, 0.09, 0])
            multScale([0.02, 0.18, 0.015]);
            mySphere(gl, program, modelView,preto);
        popMatrix();  
        pushMatrix();
            multRotationZ(120);
            multRotationZ(motor);    
            multTranslation([0, 0.09, 0])
            multScale([0.02, 0.18, 0.015]);
            mySphere(gl, program, modelView,preto);
        popMatrix();     
        pushMatrix();
            multRotationZ(240);
            multRotationZ(motor);    
            multTranslation([0, 0.09, 0])
            multScale([0.02, 0.18, 0.015]);
            mySphere(gl, program, modelView,preto);
        popMatrix(); 
        //SUPORTE HELICE
        pushMatrix();
            multTranslation([0, 0, 0.05]);
            multRotationZ(motor);    
            multScale([0.1, 0.1, 0.2]);
            multRotationX(90);
            mySuper(gl, program, modelView, 1.65, 0.99, cinzentoEscuro);
        popMatrix();
    popMatrix();  

}
//LUZES DO AVIAO
function lights() {
    var light;
    pushMatrix();
        if(lightOn){
            light = [0.2, 0.2, 0.2];
        } else{
            light = [0.9, 0.2, 0.1];
        }
        multTranslation([-1.41 , 0, 0.2]);
        multScale([0.1, 0.05, 0.2]);
        mySphere(gl, program, modelView, light);    
    popMatrix();  
    pushMatrix();
        if(lightOn){
            light = [0.0, 0.7, 0.0];
        } else{
            light = [0.2, 0.2, 0.2];
        }
        multTranslation([1.41 , 0, 0.2]);
        multScale([0.1, 0.05, 0.2]);
        mySphere(gl, program, modelView, light);    
    popMatrix();
}
//Funcao auxiliar para ativar as luzes do aviao
function activateLights(){
    auto = setInterval(changeState, 1000);
}
//Funcao auxiliar para mudar o estado das luzes(vermelho-verde)
function changeState(){
    lightOn = !lightOn;
}

//Funcao auxiliar para a iluminacao do aviao
function auxIlumination(){
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
    mNormals = normalMatrix(modelView,false);
    gl.uniformMatrix4fv(mNormalsLoc, false, flatten(mNormals));
     mView = modelView;
    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
    mViewNormals = normalMatrix(modelView);
    gl.uniformMatrix4fv(mViewNormalsLoc, false, flatten(mViewNormals));
}
//Funcoes que permitem o desenho das formas geometricas
function mySuper(gl, program, modelView, a, b, color){
    paint(color);
    superquadricInit(gl, a, b);
    
    auxIlumination();
    
    superquadricDraw(gl, program, type);
}
function myTorus(gl, program, modelView){
    paint([1, 1, 1]);

   auxIlumination();
    
    torusDraw(gl, program, type);
}
function myCube(gl, program, modelView, color){
    paint(color);
    auxIlumination();
    
    cubeDraw(gl, program, type);
}
function myCylinder(gl, program, modelView){
    paint([0.5, 0.5, 0.5]);
    auxIlumination();
    
    cylinderDraw(gl, program, false);
}
function mySphere(gl, program, modelView, color){
    paint(color);
      auxIlumination();
    sphereDraw(gl, program, type);
}
function myPyramid(gl, program, modelView){
    paint([0.3, 0.3, 0.3]);
    auxIlumination();
    
    pyramidDraw(gl, program, type);
}
function myCone(gl, program, modelView){
    paint([0.5, 0.5, 0.5]);
    auxIlumination();
    coneDraw(gl, program, type);
}
//Funcao auuxiliar para atribuir cores aos objetos
function paint(color) {
    var vColorLoc = gl.getUniformLocation(program, "mColor");
    gl.uniform3fv(vColorLoc, color);
    
     var materialAmb = gl.getUniformLocation(program, "materialAmb");
    gl.uniform3fv(materialAmb, color);
    var materialDif = gl.getUniformLocation(program, "materialDif");
    gl.uniform3fv(materialDif, color); 
    var materialSpe = gl.getUniformLocation(program, "materialSpe");
    gl.uniform3fv(materialSpe, color);
}

//Projecoes
function projection() {
    var select = typeOfView;

    switch(select){
        case "persp":
            zoom = 2.5;
            var persp = mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, -1.0 / 3, 1.0
            );  
            var at = [0+pos[1]-Math.sin(radians(orientation)), 0+pos[2], 0+pos[0]-Math.cos(radians(orientation))];
            var eye = [0+pos[1]+Math.sin(radians(orientation)), 1+pos[2], 0+pos[0]+Math.cos(radians(orientation))];
            var up = [0, 1, 0];
            modelView = lookAt(eye, at, up);
            modelView = mult(persp, modelView);
        break;
        case "cima":  
            //VISTA DE CIMA
            zoom = 2.5;
            var at = [0+pos[1], 0+pos[2], 0+pos[0]];
            var eye = [0+pos[1], 1+pos[2], 0+pos[0]];
            var up = [Math.sin(radians(-orientation)), 0, -Math.cos(radians(-orientation))];
            modelView = lookAt(eye, at, up);
        break;    
        case "frente":
            //VER DE FRENTE
            zoom = 2.5;
            var at = [0+pos[1], 0+pos[2], 0+pos[0]];
            var eye = [0+pos[1]-Math.sin(radians(orientation)), 0+pos[2], 0+pos[0]-Math.cos(radians(orientation))];
            var up = [0, 1, 0];            
            modelView = lookAt(eye, at, up);
            break;  
        
        case "lateral":
            //VER DE LADO
            zoom = 1.3;
            var at = [0+pos[1], 0+pos[2], 0+pos[0]];
            var eye = [0+pos[1]+Math.cos(radians(orientation)), 0+pos[2], 0+pos[0]-Math.sin(radians(orientation))];
            var up = [0, 1, 0];  
            modelView = lookAt(eye, at, up);
            break;
    }
}

//Define a textura
function setupTexture() {
	// Create a texture.
	texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	// Fill the texture with a 1x1 blue pixel.
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		new Uint8Array([0, 0, 255, 255]));
	// Asynchronously load an image
	var image = new Image();
	image.src = "textures/ola.jpg";
	image.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
}

window.addEventListener("keydown", function() {
    switch (event.keyCode) {
        //tecla Q (controlo de leme)
        case 81:
            if(propulsao!=0)
            orientation+=1;
            leme+=1;
            leme = Math.min(leme, 70);
        break;
        //tecla E (controlo de leme)
        case 69: 
            if(propulsao!=0)
            orientation-=1;
            leme-=1;
            leme = Math.max(leme, -70);
        break;
        //tecla W (controlo de inclinacao)           
        case 87: 
            elevator+=5;
            if(propulsao<-50)
                pos[2] += 0.05;
            elevator = Math.min(elevator, 55);
        break;
        //tecla S (controlo de inclinacao)
        case 83:
             elevator-=5;
             if (pos[2]<1){
                normalizePlane();
                pos[2] -= 0.02; 
             }else{
                pos[2] -= 0.05; 
            }
            pos[2] = Math.max(pos[2], 0);
            elevator = Math.max(elevator, -55);
        break;
        //tecla A (controlo de rolamento)        
        case 65:      
            if(pos[2]>0){
                if (pos[2]>1) {
                    airelonsRot+=1;
                    orientation+=1;
                    airelons+=1;
                } else{
                    tooLow = true;
                    count = 0;
                }
            } else{
                    airelons+=1;
            }
             airelons = Math.min(airelons, 55);
             airelonsRot = Math.min(airelonsRot, 55);

        break;
        //tecla D (controlo de rolamento)
        case 68: 
            
            if(pos[2]>0){
                if (pos[2]>1) {
                    airelonsRot-=1;
                    orientation-=1;
                    airelons-=1;
                } else{
                    tooLow = true;
                    count = 0;
                }
            } else{
                    airelons-=1;
            }

            airelons = Math.max(airelons, -55);
            airelonsRot = Math.max(airelonsRot, -55);
        break;
        //tecla R (controlo da propulsao)
        case 82: 
            if (pos[2]>0 && propulsao>-50){
                pos[2]-=0.05;
            } else{
                propulsao+=0.5;
                propulsao = Math.min(propulsao, 0);
            }
            
        break;
        //tecla F (controlo da propulsao)
        case 70: 
            propulsao-=0.5;
        break;
        
        //tecla 0 (perseguicao)
        case (48 || 96):  
            typeOfView = "persp";
        break;           
        //tecla 1 (topo)   
        case (49 || 97): 
            typeOfView = "cima";
        break;
        //tecla 2 (lateral)
        case (50 || 98): 
            typeOfView = "lateral";
        break;
        //tecla 3 (frente)
        case (51 || 99): 
            typeOfView = "frente";
        break;
            
        //tecla O (pinta com o DrawWireFrame)
        case 79: 
            type = !type;
        break;
        
    }

});

window.onresize= function (){resize()} ;

function resize(){
    canvas.height = window.innerHeight*0.95;
    canvas.width = window.innerWidth;
    aspect = canvas.width/canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function changeIt() {
    var message = "<strong>Velocity = </strong>" + Math.round(-propulsao);    
    var message1 = "<b>Not enough speed to take off</b>";
    document.getElementById('message').style.color = "black";
    document.getElementById('message2').style.color = "red";

    if (propulsao<-49) {
        var pro = propulsao;
        message1 = "<b>Can take off</b>";
        if(pos[2]>0){
            message1 = "<b>Plane is flying at altitude : </b>" + Math.round(pos[2]*10);
        }
        document.getElementById('message2').style.color = "green";
        if(tooLow && count<30 && pos[2]<=1){
            message1 = "<b>Plane is too low to turn</b>";
            document.getElementById('message2').style.color = "red";
            count++;
        }
    }
    document.getElementById('message').innerHTML=message;
    document.getElementById('message2').innerHTML=message1;

}

//Funcao auxiliar para mudar o estado da mensagem que aparece no html
function changeMessageState(){
    tooLow=false;
}
