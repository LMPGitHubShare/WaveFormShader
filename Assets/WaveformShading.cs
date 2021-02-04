using System;

namespace TonsOfNotes
{
    public class WaveformShading
    {
        private WaveFormMipMap sampleMipMap;
        private int rtSize;
        private float zoom;
        private float minZoom;
        private float maxZoom;
        private float offSet = 0;

        public WaveformShading(float[] samples, int rtSize)
        {
            this.rtSize = rtSize;
            sampleMipMap = new WaveFormMipMap(samples, rtSize);
            maxZoom = samples.Length / rtSize;
            minZoom = 1f / (maxZoom  + rtSize); // 1 texel
            zoom = maxZoom;
        }

        public static WaveformShading CreatRandom(int nbSamples, int rtSize)
        {
            float[] samples = new float[nbSamples];

            Random random = new Random();
            for (int i= 0; i < nbSamples; i++)
            {
                samples[i] = (float)random.NextDouble() * 2f - 1f; // Normalize random [-1, 1]
            }
            return new WaveformShading(samples, rtSize);
        }

        /// <summary>
        /// Send samples stream array to GPU
        /// </summary>
        public void ApplyToMaterial(UnityEngine.Material tonsMaterial)
        {
            float[] samplesStream = new float[rtSize];
            for (int i = 0; i < rtSize; i++)
            {
                float index = (i - rtSize / 2) * zoom - offSet;
                if (IsInSample(index))
                {
                    samplesStream[i] = sampleMipMap.GetValue(index, zoom);
                }
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
            offSet += offSetChange * zoom;
            ApplyToMaterial(tonsMaterial);
        }

        private bool IsInSample(float value)
        {
            if (value > sampleMipMap.GetMaxLod().Length - 1)
            {
                return false;
            }
            if (value < 0)
            {
                return false;
            }
            return true;
        }
    }
}
