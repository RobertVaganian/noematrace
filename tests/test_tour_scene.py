import importlib.util
from pathlib import Path
import unittest
import subprocess
import json
from PIL import Image, ImageChops, ImageStat

spec = importlib.util.spec_from_file_location("tour_scene", Path(__file__).parents[1] / "scripts/tour_scene.py")
scene = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scene)


class TourGeometryTests(unittest.TestCase):
    def test_fit_centers_actual_bounds_in_both_axes(self):
        for bounds in [(0, 0, 284, 52), (-80, 35, 123, 76), (240, -40, 90, 25)]:
            dx, dy = scene.fit_translation(bounds, scene.WORKSPACE)
            x, y, width, height = bounds
            vx, vy, vw, vh = scene.WORKSPACE
            self.assertAlmostEqual(x + dx + width / 2, vx + vw / 2)
            self.assertAlmostEqual(y + dy + height / 2, vy + vh / 2)

    def test_after_fit_the_whole_example_is_centered_not_left_biased(self):
        for t in [2.17, 2.6, 3.5, 4]:
            x, y = scene.navigation_frame(t)["position"]
            self.assertAlmostEqual(x + 284 / 2, 180)
            self.assertAlmostEqual(y + 52 / 2, 64)

    def test_animation_stays_visible_and_really_pans(self):
        start = scene.navigation_frame(0)["position"]
        pan = scene.navigation_frame(1)["position"]
        self.assertNotEqual(start, pan)
        for frame in range(241):
            x, y = scene.navigation_frame(frame / 60)["position"]
            self.assertGreaterEqual(x, 12)
            self.assertGreaterEqual(y, 12)
            self.assertLessEqual(x + 284, 348)
            self.assertLessEqual(y + 52, 116)

    def test_fit_click_cursor_is_inside_the_button(self):
        x, y = scene.navigation_frame(1.72)["cursor"]
        bx, by, width, height = scene.FIT_BUTTON
        self.assertTrue(bx <= x <= bx + width and by <= y <= by + height)
        self.assertEqual(scene.navigation_frame(1.72)["press"], 1)

    def test_loop_returns_to_same_geometry_and_cursor(self):
        for key in ["position", "cursor", "symbol", "press", "centered"]:
            self.assertEqual(scene.navigation_frame(0)[key], scene.navigation_frame(4)[key])

    def test_shipped_previews_decode_and_keep_the_four_second_gif_loop(self):
        root = Path(__file__).parents[1] / "public/tour"
        for theme in ["light", "dark"]:
            for kind in scene.TOUR_KINDS:
                with self.subTest(theme=theme, kind=kind):
                    base = root / f"{kind}-{theme}"
                    with Image.open(base.with_suffix(".png")) as poster:
                        self.assertEqual(poster.size, (720, 352))
                        poster.verify()
                    with Image.open(base.with_suffix(".gif")) as gif:
                        self.assertEqual(gif.size, (720, 352))
                        self.assertEqual(gif.info.get("loop"), 0)
                        self.assertGreater(gif.n_frames, 1)
                        duration = 0
                        first = gif.convert("RGB").copy()
                        for frame in range(gif.n_frames):
                            gif.seek(frame)
                            gif.load()
                            duration += gif.info["duration"]
                        self.assertEqual(duration, 4000)
                        difference = ImageStat.Stat(ImageChops.difference(first, gif.convert("RGB")))
                        self.assertLess(max(difference.mean), 1.0, "Loop endpoint must return smoothly to its opening frame")
                    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height,r_frame_rate", "-show_entries", "format=duration", "-of", "json", str(base.with_suffix(".mp4"))], check=True, capture_output=True, text=True)
                    data = json.loads(probe.stdout)
                    self.assertEqual(float(data["format"]["duration"]), 4)
                    self.assertEqual((data["streams"][0]["width"], data["streams"][0]["height"]), (720,352))
                    self.assertEqual(data["streams"][0]["r_frame_rate"], "60/1")

    def test_resizing_example_preserves_visible_panels_and_returns_to_its_start(self):
        start = scene.workspace_frame(0)
        self.assertEqual(start, scene.workspace_frame(4))
        self.assertGreater(scene.workspace_frame(1.9)["inspector"], start["inspector"])
        self.assertGreater(scene.workspace_frame(1.9)["log"], start["log"])
        for frame in range(241):
            value = scene.workspace_frame(frame/60)
            self.assertTrue(80 <= value["inspector"] <= 112)
            self.assertTrue(30 <= value["log"] <= 50)
            self.assertTrue(value["vertical_x"] >= 234)
            self.assertTrue(value["horizontal_y"] >= 90)
            self.assertTrue(0 < value["cursor"][0] < 360)
            self.assertTrue(0 < value["cursor"][1] < 176)


    def test_event_row_fades_before_losing_its_measured_bottom_padding(self):
        from PIL import ImageFont
        font = ImageFont.truetype(str(Path(__file__).parents[1] / "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"),20)
        bottom = 28 + font.getbbox("3 events")[3]/2
        self.assertEqual(scene.row_opacity(bottom+6,bottom),0)
        self.assertEqual(scene.row_opacity(bottom+10,bottom),1)
        self.assertTrue(0 < scene.row_opacity(bottom+8,bottom) < 1)
        for frame in range(241):
            height=scene.workspace_frame(frame/60)["log"]
            if scene.row_opacity(height,bottom)>0:
                self.assertGreater(height-bottom,6)

    def test_encoded_workspace_never_paints_event_text_below_the_panel(self):
        root=Path(__file__).parents[1] / "public/tour"
        for theme in ["light","dark"]:
            with Image.open(root/f"workspace-{theme}.gif") as gif:
                for frame in range(gif.n_frames):
                    gif.seek(frame)
                    image=gif.convert("RGB")
                    # The board ends at y140. This strip is before the caption,
                    # away from the moving pointer and all legitimate borders.
                    strip=image.crop((26*2,142*2,110*2,148*2))
                    backdrop=Image.new("RGB",strip.size,image.getpixel((0,0)))
                    difference=ImageStat.Stat(ImageChops.difference(strip,backdrop))
                    self.assertLess(max(difference.mean),.1,f"{theme}, frame {frame}: text leaked through the lower border")

    def test_inspection_click_precedes_the_panel_and_returns_to_the_start(self):
        self.assertEqual(scene.inspection_frame(0),scene.inspection_frame(4))
        self.assertEqual(scene.inspection_frame(.55)["open"],0)
        self.assertGreater(scene.inspection_frame(1)["open"],.99)
        x,y=scene.inspection_frame(.62)["cursor"]
        self.assertTrue(120<=x<=140)
        self.assertTrue(90<=y<=110)



class CaseChapterTests(unittest.TestCase):
    def test_each_chapter_is_an_independent_complete_seven_second_video(self):
        root = Path(__file__).parents[1] / "public/case"
        for theme, index in [(theme, index) for theme in ["light", "dark"] for index in range(1, 6)]:
            with self.subTest(theme=theme, chapter=index):
                base = root / theme / f"chapter-{index}"
                with Image.open(base.with_suffix(".jpg")) as poster:
                    self.assertEqual(poster.size, (1600, 1000))
                    poster.verify()
                probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height,r_frame_rate", "-show_entries", "format=duration", "-of", "json", str(base.with_suffix(".mp4"))], check=True, capture_output=True, text=True)
                data = json.loads(probe.stdout)
                self.assertEqual(float(data["format"]["duration"]), 7)
                self.assertEqual((data["streams"][0]["width"], data["streams"][0]["height"]), (1600, 1000))
                self.assertEqual(data["streams"][0]["r_frame_rate"], "60/1")


if __name__ == "__main__":
    unittest.main()
