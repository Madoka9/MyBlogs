const yinYangVertexShader = `

uniform float uTwistAngle;
uniform float uRadius;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vNormalT;
varying vec3 vPosition;
varying vec3 vEyePos1;
varying vec3 vEyePos2;
varying vec3 vEyePos3;
varying vec3 vEyePos4;

void GetSphereSurfacePosXAxis(vec3 pos, float Radius, out vec3 SurfacePos) 
{
  float OutX = sqrt(Radius * Radius - pos.y * pos.y - pos.z * pos.z);
  SurfacePos = vec3(pos.x > 0.0 ? OutX : -OutX, pos.y, pos.z) * vec3(1., 1.0, 1.0);
}


void main() {
  vUv = uv;

  vec3 pos = position;
  //确定变形轴，这里选择x轴
  float t = pos.x;
  vec2 planePos = pos.yz;

  float twistFactor = 1.0;
 
  float normalizedT = 0.5 * ( t / uRadius + 1. );

  twistFactor = normalizedT;

  float angle = twistFactor * uTwistAngle;
  // 计算旋转矩阵
  mat2 rotationMatrix = mat2(
      cos(angle), -sin(angle),
      sin(angle), cos(angle)
  );

  // 应用旋转到顶点位置
  planePos = rotationMatrix * planePos;
  pos.yz = planePos;

  // 更新法线
  vec3 transformedNormal = normal;
  transformedNormal.yz = rotationMatrix * transformedNormal.yz;
  vNormal = normalize(normalMatrix * transformedNormal);
  vNormalT = normalize(transformedNormal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  // 计算鱼眼位置 - 以x轴为例
  vec3 Dir = vec3(0.0, 0.0, 1.0);
  Dir.yz = rotationMatrix * Dir.yz;

  vec3 TempPos1 = vec3(uRadius, 0.0, 0.0);
  vec3 eyePos1 = TempPos1 + Dir * uRadius;
  vec3 eyePos2 = TempPos1 - Dir * uRadius;
  //GetSphereSurfacePosXAxis(eyePos1, uRadius, eyePos1);
  //GetSphereSurfacePosXAxis(eyePos2, uRadius, eyePos2);
  vec3 TempPos2 = vec3(-uRadius, 0.0, 0.0);
  vec3 eyePos3 = TempPos2 + Dir * uRadius;
  vec3 eyePos4 = TempPos2 - Dir * uRadius;
  //GetSphereSurfacePosXAxis(eyePos3, uRadius, eyePos3);
  //GetSphereSurfacePosXAxis(eyePos4, uRadius, eyePos4);

  vPosition = pos;
  vEyePos1 = eyePos1;
  vEyePos2 = eyePos2;
  vEyePos3 = eyePos3;
  vEyePos4 = eyePos4;
}
`;

const yinYangFragmentShader = `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vNormalT;
  varying vec3 vEyePos1;
  varying vec3 vEyePos2;
  varying vec3 vEyePos3;
  varying vec3 vEyePos4;

  uniform vec3 uColorA; //white
  uniform vec3 uColorB; //Red
  uniform float uRadius;  
  uniform sampler2D uTexture;


  void GetSphereSurfaceDistance(vec3 p1, vec3 p2, float Radius, out float Distance) 
  {
  
    // 使用数值稳定的方法
    vec3 v1 = normalize(normalize(p1) * Radius);
    vec3 v2 = normalize(normalize(p2) * Radius);
    
    float dot_product = dot(v1, v2);
    vec3 cross_product = cross(v1, v2);
    float sin_angle = length(cross_product);
    
    float angle = atan(sin_angle, dot_product);
    Distance = Radius * angle;
  }

  void main() {
      // 从纹理采样颜色
      vec4 texColor = texture2D(uTexture, vUv);

  vec2 uv = vUv;
  //cal base mask

  float baseMask = step(0.5, uv.x);
  vec3 color = mix(uColorA, uColorB, baseMask);
  
  float eyeRadius = uRadius * 0.25;
  // // 使用点积计算角距离（更准确的球面距离）
  float eye1_dist = distance(vPosition, vEyePos1);
  //GetSphereSurfaceDistance(vPosition, vEyePos1, uRadius, eye1_dist);
  float eye2_dist = distance(vPosition, vEyePos2);
  //GetSphereSurfaceDistance(vPosition, vEyePos2, uRadius, eye2_dist);
  float eye3_dist = distance(vPosition, vEyePos3);
  //GetSphereSurfaceDistance(vPosition, vEyePos3, uRadius, eye3_dist);
  float eye4_dist = distance(vPosition, vEyePos4);
  //GetSphereSurfaceDistance(vPosition, vEyePos4, uRadius, eye4_dist);
  
  // 转换为弧长距离进行比较
  float eye1_mask = 1.0 - step(0.5, eye1_dist);
  float eye2_mask = 1.0 - step(0.5, eye2_dist);
  float eye3_mask = 1.0 - step(0.5, eye3_dist);
  float eye4_mask = 1.0 - step(0.5, eye4_dist);

  // fresnel
  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
  vec3 rimColor = vec3(0.4, 0.6, 1.0);
  color += rimColor * fresnel * 0.6;

  
  //gl_FragColor = vec4(color, 1.0);
  color = mix(color, uColorB, max(eye1_mask, eye3_mask));
  color = mix(color, uColorA, max(eye2_mask, eye4_mask));
  gl_FragColor = vec4(vec3(color), 1.0);
}
`;
