Shader "Danao/SpiritInner"
{
    Properties
    {
        _Color ("Color", Color) = (1, 1, 1, 1)
        _Emission ("Emission", Color) = (0.5, 0.25, 0.1, 1)
        _FlowSpeed ("Flow Speed", Range(0.2, 8)) = 2.6
        _Gloss ("Gloss", Range(0, 1)) = 0.52
        _MainTex ("Texture", 2D) = "white" {}
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Geometry" }
        LOD 200
        Cull Back
        ZWrite On
        Lighting Off
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma target 2.0
            #include "UnityCG.cginc"
            sampler2D _MainTex;
            float4 _MainTex_ST;
            fixed4 _Color;
            fixed4 _Emission;
            half _FlowSpeed;
            half _Gloss;
            struct appdata
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                float2 uv : TEXCOORD0;
            };
            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 worldN : TEXCOORD1;
                float3 worldP : TEXCOORD2;
                float3 localP : TEXCOORD3;
            };
            v2f vert(appdata v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                o.worldN = UnityObjectToWorldNormal(v.normal);
                o.worldP = mul(unity_ObjectToWorld, v.vertex).xyz;
                o.localP = v.vertex.xyz;
                return o;
            }
            fixed4 frag(v2f i) : SV_Target
            {
                float3 n = normalize(i.worldN);
                float3 v = normalize(_WorldSpaceCameraPos.xyz - i.worldP);
                float ndv = saturate(dot(n, v));
                float rim = 1.0 - ndv;
                float inner = saturate(1.18 - rim * 1.55);
                float y = i.localP.y;
                float x = i.localP.x;
                float band = sin(y * 11.0 + _Time.y * _FlowSpeed + x * 2.4);
                float vein = sin(y * 5.5 - _Time.y * _FlowSpeed * 0.65 + x * 6.0);
                float flow = saturate(0.32 + 0.50 * (0.5 + 0.5 * band) + 0.20 * (0.5 + 0.5 * vein));
                float pulse = 0.84 + 0.16 * sin(_Time.y * _FlowSpeed * 0.45);
                fixed4 tex = tex2D(_MainTex, i.uv);
                float wrap = saturate(ndv * 0.55 + 0.45);
                float spec = pow(ndv, 12.0) * _Gloss * 0.35;
                fixed3 albedo = tex.rgb * _Color.rgb * (0.62 + 0.28 * wrap + 0.12 * flow);
                fixed3 emit = _Emission.rgb * flow * pulse * inner;
                return fixed4(albedo + emit + spec, 1);
            }
            ENDCG
        }
    }
    FallBack "Unlit/Color"
}
