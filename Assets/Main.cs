using TonsOfNotes;
using UnityEngine;

public class Main : MonoBehaviour
{
    public const int _samplesStreamSize = 1023; // Maximum array size (GPU API limitation, Unity was 1023) this must match const in shader

    public float zoomScale = 0.4f;
    public float offSetScale = 10f;

    public Material planeRenderTargetMaterial;

    private WaveformShading waveFromShading;
    private float oldMouseScrollDeltay;

    void Start()
    {


        waveFromShading = WaveformShading.CreatRandom(44100 * 3 * 60, _samplesStreamSize); // 3 min mp3 44100 Hz

        waveFromShading.ApplyToMaterial(planeRenderTargetMaterial);
    }

    void Update()
    {
        // Zoom
        if (Input.mouseScrollDelta.y != oldMouseScrollDeltay)
        {
            waveFromShading.ApplyZoom(planeRenderTargetMaterial, -Input.mouseScrollDelta.y * zoomScale);
        }
        oldMouseScrollDeltay = Input.mouseScrollDelta.y;

        // OffSet
        if (Input.GetKey("up"))
        {
            waveFromShading.ApplyOffSet(planeRenderTargetMaterial, offSetScale);
        }
        if (Input.GetKey("down"))
        {
            waveFromShading.ApplyOffSet(planeRenderTargetMaterial, -offSetScale);
        }
    }
}
