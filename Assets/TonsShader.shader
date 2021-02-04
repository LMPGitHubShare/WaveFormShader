Shader "Custom/TonsShader"
{
    SubShader
    {
        Tags { "RenderType" = "Opaque" }
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct vertexInput
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct vertexOuput
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
            };

            // Vertex shader
            vertexOuput vert(vertexInput input)
            {
                vertexOuput output;
                output.vertex = UnityObjectToClipPos(input.vertex);
                output.uv = input.uv;
                return output;
            }

            static const int _samplesSize = 1023;
            float _samples[_samplesSize];
            // Pixel shader
            fixed4  frag(vertexOuput input) : SV_Target
            {
                float index = (input.uv.y) * _samplesSize;

                float sampleValue = abs(_samples[index]);

                float pixelValue = ((0.5 - sampleValue / 2 < input.uv.x) && (0.5 + sampleValue / 2 > input.uv.x) > 0 ? 1.0 : 0.0);

                return fixed4(pixelValue, pixelValue, pixelValue, 1);
            }
            ENDCG
        }
    }
}
