require './packets/ip'
require './packets/arp'

class Ethernet
  def initialize packet
    @dest = packet[0, 6].unpack('H*').first
    @src = packet[6, 6].unpack('H*').first
    @type = packet[12, 2].unpack('n').first
    
    if @type == 0x0800
      @inner = IP.new packet[14..-1]
    elsif @type == 0x0806
      @inner = ARP.new packet[14..-1]
    else
      puts "EtherType #{@type.to_s(16).rjust 4, '0'} seen"
    end
  end
end

