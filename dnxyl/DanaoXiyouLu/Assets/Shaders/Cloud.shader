Shader "Danao/Cloud"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Tint ("Tint", Color) = (1, 1, 1, 0.78)
        _Scroll ("Scroll", Vector) = (0.035, 0.012, 0, 0)
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
            float4 _Scroll;
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
                o.uv = TRANSFORM_TEX(v.uv, _MainTex) + _Scroll.xy * _Time.y;
                return o;
            }
            fixed4 frag(v2f i) : SV_Target
            {
                fixed4 t = tex2D(_MainTex, i.uv);
                float lum = dot(t.rgb, fixed3(0.30, 0.50, 0.20));
                float a = saturate(lum * 1.15) * _Tint.a;
                return fixed4(t.rgb * _Tint.rgb, a);
            }
            ENDCG
        }
    }
}
