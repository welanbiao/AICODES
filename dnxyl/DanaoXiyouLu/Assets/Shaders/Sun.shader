Shader "Danao/Sun"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Tint ("Tint", Color) = (1, 0.9, 0.55, 1)
        _Boost ("Boost", Range(0.5, 6)) = 1.8
        _WhiteMix ("White Mix", Range(0, 1)) = 0
    }
    SubShader
    {
        Tags { "Queue"="Transparent" "IgnoreProjector"="True" "RenderType"="Transparent" }
        Blend SrcAlpha OneMinusSrcAlpha
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
            half _WhiteMix;
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
                float sky = saturate((t.b - max(t.r, t.g) - 0.012) * 14.0);
                float pale = saturate((t.b - t.r - 0.045) * 10.0) * saturate(1.15 - chroma * 3.5);
                float a = saturate(max(t.a, lum) * 1.35) * (1.0 - paper) * (1.0 - sky) * (1.0 - pale);
                clip(a - 0.04);
                fixed3 rgb = t.rgb;
                fixed3 hot = fixed3(1.08, 1.06, 1.02);
                rgb = lerp(rgb, hot, _WhiteMix);
                rgb = lerp(rgb, hot * 1.12, _WhiteMix * _WhiteMix);
                rgb.b = min(rgb.b, lerp(rgb.b, min(rgb.r, rgb.g) * 0.97, _WhiteMix));
                rgb *= _Tint.rgb * lerp(1.0, _Boost, 0.55 + 0.45 * _WhiteMix);
                return fixed4(rgb, saturate(a));
            }
            ENDCG
        }
    }
}
