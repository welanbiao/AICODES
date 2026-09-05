Shader "Danao/Sun"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Tint ("Tint", Color) = (1, 0.9, 0.55, 1)
        _Boost ("Boost", Range(0.5, 6)) = 1.8
    }
    SubShader
    {
        Tags { "Queue"="Transparent" "IgnoreProjector"="True" "RenderType"="Transparent" }
        Blend One OneMinusSrcColor
        ZWrite Off
        Cull Off
        Lighting Off
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            sampler2D _MainTex;
            float4 _MainTex_ST;
            fixed4 _Tint;
            half _Boost;
            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };
            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
            };
            v2f vert(appdata v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                return o;
            }
            fixed4 frag(v2f i) : SV_Target
            {
                fixed4 t = tex2D(_MainTex, i.uv);
                float lum = dot(t.rgb, fixed3(0.30, 0.50, 0.20));
                float mn = min(t.r, min(t.g, t.b));
                float mx = max(t.r, max(t.g, t.b));
                float chroma = mx - mn;
                float paper = saturate((lum - 0.82) / 0.14) * saturate(1.15 - chroma * 9.0);
                clip(lum - 0.04 - paper);
                float a = saturate((lum - 0.04) * 1.55) * (1.0 - paper) * max(t.a, 0.35);
                return t * _Tint * _Boost * a;
            }
            ENDCG
        }
    }
}
