using TonsOfNotes;
using UnityEngine;

public class Main : MonoBehaviour
{
    public float zoomScale = 0.1f;
    public float offSetScale = 1f;

    public Material planeMaterial;

    private WaveformShading tonsShading;
    private float oldMouseScrollDeltay;

    void Start()
    {
        tonsShading = WaveformShading.CreatRandom(44100 * 2 * 60); // 3 min mp3 44100 Hz

        tonsShading.ApplyToMaterial(planeMaterial);
    }

    void Update()
    {
        if (Input.mouseScrollDelta.y != oldMouseScrollDeltay)
        {
            tonsShading.ApplyZoom(planeMaterial, -Input.mouseScrollDelta.y * zoomScale);
        }
        oldMouseScrollDeltay = Input.mouseScrollDelta.y;

        if (Input.GetKey("up"))
        {
            tonsShading.ApplyOffSet(planeMaterial, offSetScale);
        }

        if (Input.GetKey("down"))
        {
            tonsShading.ApplyOffSet(planeMaterial,-offSetScale);
        }
    }
}
