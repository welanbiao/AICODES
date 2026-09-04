Shader "Danao/Mythic"
{
    Properties
    {
        _Color ("Color", Color) = (1,1,1,1)
        _MainTex ("Texture", 2D) = "white" {}
        _RimColor ("Rim Color", Color) = (1, 0.82, 0.35, 1)
        _RimPower ("Rim Power", Range(0.4, 10)) = 2.4
        _Emission ("Emission", Color) = (0,0,0,0)
        _Spec ("Spec", Color) = (1, 0.92, 0.7, 1)
        _Gloss ("Gloss", Range(0, 1)) = 0.45
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Geometry" }
        LOD 200
        CGPROGRAM
        #pragma surface surf Lambert vertex:vert
        sampler2D _MainTex;
        fixed4 _Color;
        fixed4 _RimColor;
        half _RimPower;
        fixed4 _Emission;
        fixed4 _Spec;
        half _Gloss;
        struct Input
        {
            float2 uv_MainTex;
            float3 viewDir;
            float3 worldNormal;
            float4 color : COLOR;
        };
        void vert(inout appdata_full v)
        {
            // keep vertex color
        }
        void surf(Input IN, inout SurfaceOutput o)
        {
            fixed4 c = tex2D(_MainTex, IN.uv_MainTex) * _Color * IN.color;
            half rim = 1.0 - saturate(dot(normalize(IN.viewDir), IN.worldNormal));
            o.Albedo = c.rgb;
            o.Emission = _Emission.rgb + _RimColor.rgb * pow(rim, _RimPower);
            o.Specular = _Gloss;
            o.Gloss = _Gloss;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
