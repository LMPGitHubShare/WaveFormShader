using System;

namespace TonsOfNotes
{
    public class WaveformShading
    {
        public const int _samplesStreamSize = 1023; // Maximum array size (GPU API limitation, Unity was 1023)

        private WaveFormMipMap sampleMipMap;
        private float zoom;
        private float minZoom;
        private float maxZoom;
        private float offSet = 0;

        public WaveformShading(float[] samples)
        {
            sampleMipMap = new WaveFormMipMap(samples, _samplesStreamSize);
            maxZoom = samples.Length / _samplesStreamSize;
            minZoom = 1f / maxZoom; // 1 texel
            zoom = maxZoom;
        }

        public static WaveformShading CreatRandom(int nbSamples)
        {
            float[] samples = new float[nbSamples];

            Random random = new Random();
            for (int i= 0; i < nbSamples; i++)
            {
                samples[i] = (float)random.NextDouble() * 2f - 1f; // Normalize random [-1, 1]
            }
            return new WaveformShading(samples);
        }

        /// <summary>
        /// Send samples stream to GPU
        /// </summary>
        public void ApplyToMaterial(UnityEngine.Material tonsMaterial)
        {
            float[] samplesStream = new float[_samplesStreamSize];
            for (int i = 0; i < _samplesStreamSize; i++)
            {
                samplesStream[i] = sampleMipMap.GetValue(Saturate((i - offSet) * zoom), zoom);
            }
            
            tonsMaterial.SetFloatArray("_samples", samplesStream);
        }

        public void ApplyZoom(UnityEngine.Material tonsMaterial, float zoomChange)
        {
            zoom += zoomChange * zoom;
            if (zoom < minZoom) { zoom = minZoom; }
            if (zoom > maxZoom) { zoom = maxZoom; }
            ApplyToMaterial(tonsMaterial);
        }

        public void ApplyOffSet(UnityEngine.Material tonsMaterial, float offSetChange)
        {
            offSet += offSetChange;
            ApplyToMaterial(tonsMaterial);
        }

        private float Saturate(float value)
        {
            if (value > sampleMipMap.GetMaxLod().Length - 1)
            {
                return sampleMipMap.GetMaxLod().Length - 1;
            }
            if (value < 0)
            {
                return 0;
            }
            return value;
        }
    }
}
