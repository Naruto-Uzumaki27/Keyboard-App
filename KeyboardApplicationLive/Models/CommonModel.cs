namespace KeyBoardApplicationDemo.Models
{
    public class ApplicationManagerModel
    {
        public int last_used_keyboard_id { get; set; }
        public string keyboard_name { get; set; } = string.Empty;
        public List<int> languages { get; set; } = new List<int>();
        public List<string> list_of_languages { get; set; } = new List<string>();
    }
    public class KeyboardsModel
    {
        public int keyboard_id { get; set; }
        public string keyboard_name { get; set; } = string.Empty;
        public int is_modified { get; set; }
        public List<List<Keys>> keys { get; set; } = new List<List<Keys>>();
        public List<comp> compList { get; set; } = new List<comp>();
        public int deleteflag { get; set; } = 0;
    }
    public class Keys
    {
        // Using @ to escape the char keyword
        public string @char { get; set; } = string.Empty;
        public string sc { get; set; } = string.Empty;
        public int mod { get; set; }
        public string modchar { get; set; } = string.Empty;
        public string app { get; set; } = string.Empty;
    }
    public class comp
    {
        public string compName { get; set; } = string.Empty;
        public string compValue { get; set; } = string.Empty;
    }
}
