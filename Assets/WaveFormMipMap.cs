using System.Collections.Generic;

namespace TonsOfNotes
{
    public class WaveFormMipMap
    {
        private List<float[]> mipMap;
        public WaveFormMipMap(float[] samples, int stopMip)
        {
            mipMap = new List<float[]>();
            mipMap.Add(samples);

            float[] lastMap = samples;
            while (lastMap.Length / 2 > stopMip)
            {
                float[] newMap = new float[lastMap.Length / 2];
                for (int i = 0; i < newMap.Length; i++)
                {
                    newMap[i] = (lastMap[i * 2] > lastMap[i * 2 + 1] ? lastMap[i * 2] : lastMap[i * 2 + 1]);
                }
                mipMap.Add(newMap);
                lastMap = newMap;
            }
        }

        public float GetValue(float i, float texelSize)
        {
            float[] lod = GetLod(texelSize);
            int index = (int)(((float)i) / GetMaxLod().Length * lod.Length);
            return lod[index];
        }

        public float[] GetLod(float texelSize)
        {
            for (int i = 0; i < mipMap.Count; i++)
            {
                if (GetMaxLod().Length / mipMap[i].Length > texelSize)
                {
                    return mipMap[i];
                }
            }
            return GetMinLod();
        }

        public float[] GetMaxLod()
        {
            return mipMap[0];
        }
        public float[] GetMinLod()
        {
            return mipMap[mipMap.Count - 1];
        }
    }
}
